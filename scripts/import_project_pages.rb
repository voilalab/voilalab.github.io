#!/usr/bin/env ruby

require "fileutils"
require "find"
require "net/http"
require "optparse"
require "pathname"
require "rubygems/package"
require "tempfile"
require "tmpdir"
require "uri"
require "yaml"
require "zlib"

ROOT = Pathname.new(__dir__).join("..").expand_path
MANIFEST = ROOT.join("_data/project_pages.yml")
COLLECTION = ROOT.join("_project_pages")
ALLOWED_ASSET_EXTENSIONS = %w[.avif .csv .gif .jpeg .jpg .json .md .mp4 .pdf .png .svg .webm .webp].freeze

options = { local: {} }
OptionParser.new do |parser|
  parser.banner = "Usage: import_project_pages.rb [--local SLUG=REPOSITORY_PATH]"
  parser.on("--local SOURCE", "Use a local repository for one project") do |source|
    slug, path = source.split("=", 2)
    raise OptionParser::InvalidArgument, "expected SLUG=REPOSITORY_PATH" unless slug && path

    options[:local][slug] = Pathname.new(path).expand_path
  end
end.parse!

def fail_import(message)
  warn "Project page import failed: #{message}"
  exit 1
end

def safe_yaml(path)
  YAML.safe_load(path.read, permitted_classes: [], aliases: false)
rescue Psych::Exception => e
  fail_import("invalid YAML in #{path}: #{e.message}")
end

def fetch_archive(repository, ref)
  uri = URI("https://codeload.github.com/#{repository}/tar.gz/#{ref}")
  response = Net::HTTP.get_response(uri)
  fail_import("could not fetch #{repository}@#{ref} (HTTP #{response.code})") unless response.is_a?(Net::HTTPSuccess)

  file = Tempfile.new(["project-page", ".tar.gz"])
  file.binmode
  file.write(response.body)
  file.rewind
  file
rescue StandardError => e
  file&.close!
  fail_import("could not fetch #{repository}@#{ref}: #{e.message}")
end

def extract_source(archive, source, destination)
  source_parts = Pathname.new(source).each_filename.to_a
  Zlib::GzipReader.open(archive.path) do |gzip|
    Gem::Package::TarReader.new(gzip) do |tar|
      tar.each do |entry|
        parts = Pathname.new(entry.full_name).each_filename.to_a
        relative = parts.drop(1)
        next unless relative.first(source_parts.length) == source_parts

        output_parts = relative.drop(source_parts.length)
        next if output_parts.empty?
        fail_import("unsafe archive path #{entry.full_name}") if output_parts.any? { |part| part == ".." || part.empty? }
        fail_import("links are not allowed: #{entry.full_name}") if %w[1 2].include?(entry.header.typeflag)

        output = destination.join(*output_parts)
        if entry.directory?
          FileUtils.mkdir_p(output)
        elsif entry.file?
          FileUtils.mkdir_p(output.dirname)
          output.binwrite(entry.read)
        end
      end
    end
  end
end

def validate_relative_path(value, label)
  path = Pathname.new(value.to_s)
  fail_import("#{label} must be a relative path") if path.absolute? || path.each_filename.any? { |part| part == ".." }
  path
end

def validate_project(manifest_entry, source_dir)
  metadata_path = source_dir.join("project.yml")
  fail_import("missing #{metadata_path}") unless metadata_path.file?
  metadata = safe_yaml(metadata_path)
  fail_import("project.yml must contain a mapping") unless metadata.is_a?(Hash)

  required = %w[schema_version slug title subtitle description year venue authors affiliation links sections source]
  missing = required.reject { |key| metadata.key?(key) && !metadata[key].nil? }
  fail_import("#{manifest_entry['slug']} is missing metadata: #{missing.join(', ')}") unless missing.empty?
  fail_import("unsupported schema version for #{metadata['slug']}") unless metadata["schema_version"] == 1
  fail_import("manifest slug does not match project.yml") unless metadata["slug"] == manifest_entry["slug"]
  fail_import("invalid slug #{metadata['slug']}") unless metadata["slug"].match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)

  unless metadata["authors"].is_a?(Array) && metadata["authors"].all? { |author| author.is_a?(Hash) && author["name"] && author["url"] }
    fail_import("#{metadata['slug']} authors must provide name and url")
  end
  unless metadata["links"].is_a?(Array) && metadata["links"].all? { |link| link.is_a?(Hash) && link["label"] && link["url"] }
    fail_import("#{metadata['slug']} links must provide label and url")
  end
  unless metadata["sections"].is_a?(Array) && metadata["sections"].all? { |section| section.is_a?(Hash) && section["id"] && section["label"] }
    fail_import("#{metadata['slug']} sections must provide id and label")
  end

  content_path = source_dir.join(validate_relative_path(metadata["source"], "source"))
  fail_import("missing content file #{content_path}") unless content_path.file?
  content = content_path.read
  fail_import("#{metadata['slug']} content must not contain Jekyll front matter") if content.start_with?("---\n")
  fail_import("#{metadata['slug']} content contains document-level HTML") if content.match?(/<(?:html|head|body)\b/i)
  fail_import("#{metadata['slug']} content contains a site navbar") if content.match?(/class=["'][^"']*(?:site-nav|navbar)/i)
  fail_import("#{metadata['slug']} content contains executable HTML") if content.match?(/<script\b|\son\w+\s*=|javascript:/i)
  fail_import("#{metadata['slug']} content contains Liquid markup") if content.match?(/{{|{%/)

  heading_ids = content.scan(/^##\s+(.+?)\s*#*$/).flatten.map do |heading|
    heading.downcase.gsub(/[^a-z0-9\s-]/, "").strip.gsub(/\s+/, "-")
  end
  section_ids = metadata["sections"].map { |section| section["id"] }
  fail_import("#{metadata['slug']} has duplicate section IDs") unless section_ids.uniq.length == section_ids.length
  missing_sections = section_ids - heading_ids
  fail_import("#{metadata['slug']} content is missing sections: #{missing_sections.join(', ')}") unless missing_sections.empty?

  assets_dir = source_dir.join("assets")
  if assets_dir.exist?
    fail_import("#{assets_dir} must be a directory") unless assets_dir.directory?
    Find.find(assets_dir.to_s) do |entry|
      path = Pathname.new(entry)
      fail_import("symbolic links are not allowed: #{path}") if path.symlink?
      next unless path.file?

      fail_import("unsupported asset type: #{path}") unless ALLOWED_ASSET_EXTENSIONS.include?(path.extname.downcase)
      fail_import("asset must not contain Jekyll front matter: #{path}") if path.open("rb") { |file| file.read(4) } == "---\n"
    end
  end
  Array(metadata["assets"]).each do |asset|
    path = validate_relative_path(asset.fetch("path"), "asset path")
    fail_import("missing asset #{path}") unless source_dir.join(path).file?
    fail_import("asset #{path} requires alt text") if asset["alt"].to_s.strip.empty?
  end
  if metadata["hero_image"]
    hero = validate_relative_path(metadata["hero_image"], "hero image")
    fail_import("missing hero image #{hero}") unless source_dir.join(hero).file?
  end

  [metadata, content]
end

manifest = safe_yaml(MANIFEST)
fail_import("#{MANIFEST} must contain a list") unless manifest.is_a?(Array)

build_root = Pathname.new(Dir.mktmpdir("project-pages-build-"))
build_collection = build_root.join("collection")
build_routes = build_root.join("routes")
FileUtils.mkdir_p(build_collection)
FileUtils.mkdir_p(build_routes)
at_exit { FileUtils.rm_rf(build_root) }

slugs = manifest.filter_map { |entry| entry["slug"] if entry.is_a?(Hash) }
fail_import("manifest contains duplicate slugs") unless slugs.uniq.length == slugs.length

manifest.each do |entry|
  fail_import("manifest entries must be mappings") unless entry.is_a?(Hash)
  %w[slug repository ref source].each do |key|
    fail_import("manifest entry is missing #{key}") if entry[key].to_s.empty?
  end
  fail_import("repository must use owner/name format") unless entry["repository"].match?(%r{\A[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\z})
  fail_import("ref must be a full commit SHA") unless entry["ref"].match?(/\A[0-9a-f]{40}\z/)

  slug = entry["slug"]
  staging = Pathname.new(Dir.mktmpdir("project-page-"))
  begin
    if options[:local].key?(slug)
      source_dir = options[:local][slug].join(entry["source"])
      fail_import("local source does not exist: #{source_dir}") unless source_dir.directory?
    else
      archive = fetch_archive(entry["repository"], entry["ref"])
      source_dir = staging.join("source")
      FileUtils.mkdir_p(source_dir)
      extract_source(archive, entry["source"], source_dir)
      archive.close!
    end

    metadata, content = validate_project(entry, source_dir)
    front_matter = {
      "layout" => "project",
      "title" => "#{metadata['title']} #{metadata['subtitle']}",
      "description" => metadata["description"],
      "permalink" => "/#{slug}/",
      "math" => metadata["math"] == true,
      "project_page" => true,
      "project" => metadata
    }
    build_collection.join("#{slug}.md").write("---\n#{YAML.dump(front_matter).delete_prefix("---\n")}---\n\n#{content}")

    output_assets = build_routes.join(slug, "assets")
    FileUtils.mkdir_p(output_assets.dirname)
    FileUtils.cp_r(source_dir.join("assets"), output_assets) if source_dir.join("assets").directory?
    puts "Imported #{slug} from #{options[:local].key?(slug) ? options[:local][slug] : "#{entry['repository']}@#{entry['ref']}"}"
  ensure
    FileUtils.rm_rf(staging)
  end
end

FileUtils.rm_rf(COLLECTION)
FileUtils.mv(build_collection, COLLECTION)
manifest.each do |entry|
  output_assets = ROOT.join(entry["slug"], "assets")
  staged_assets = build_routes.join(entry["slug"], "assets")
  FileUtils.rm_rf(output_assets)
  FileUtils.mkdir_p(output_assets.dirname)
  FileUtils.cp_r(staged_assets, output_assets) if staged_assets.directory?
end
