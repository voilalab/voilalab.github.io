require 'bibtex'

# Joins _data/papers.yml with assets/ref.bib and picks the papers each research
# theme shows on /research/.
#
# For every papers.yml entry, adds from the bib (unless papers.yml already sets it):
#   title  (braces stripped), year (integer), venue (short label, e.g. "CVPR"),
#   paper_url (DOI link, else the bib url)
#
# For every theme in _data/research.yml, adds:
#   shown:  papers to list on the card, newest first. Every paper tagged with the
#           theme and `featured: true`, then the most recent tagged papers (published
#           before preprints), up to `selection.max_per_theme` in total.
#   count:  number of papers tagged with the theme, for the "all N papers" link.
module Jekyll
  class ResearchPapers < Generator
    safe true
    priority :normal

    VENUES = [
      [/\(([A-Z][A-Za-z0-9]+)(?: \d{4})?\)/, nil], # acronym in parentheses: "(CVPR)", "(ECCV 2026)"
      [/Neural Information Processing Systems/i, 'NeurIPS'],
      [/International Conference on Machine Learning/i, 'ICML'],
      [/Conference on Learning Representations/i, 'ICLR'],
      [/Machine Learning for Health/i, 'ML4H'],
      [/Transactions on Information Theory/i, 'IEEE Trans. Inf. Theory'],
      [/SIAM Journal on Imaging Sciences/i, 'SIAM J. Imaging Sci.'],
      [/PLOS ONE/i, 'PLOS ONE'],
    ].freeze

    def generate(site)
      papers = site.data['papers'] ||= {}
      research = site.data['research']
      bib = load_bib(site)

      papers.each do |key, meta|
        next unless meta.is_a?(Hash)
        entry = bib[key]
        unless entry
          Jekyll.logger.warn 'ResearchPapers:', "#{key} is in papers.yml but not in ref.bib"
          next
        end
        meta['key'] = key
        meta['title'] ||= clean(entry[:title])
        meta['year'] ||= entry[:year].to_s.to_i
        meta['month'] ||= month_number(entry[:month])
        meta['venue'] ||= venue(entry)
        meta['paper_url'] ||= entry[:doi] ? "https://doi.org/#{entry[:doi]}" : entry[:url]&.to_s
      end

      return unless research && research['themes']

      opts = research['selection'] || {}
      max = (opts['max_per_theme'] || 4).to_i
      recent_years = (opts['recent_years'] || 2).to_i
      cutoff = Time.now.year - recent_years + 1

      order = papers.keys
      research['themes'].each do |theme|
        slug = theme['slug']
        tagged = papers.values.select { |m| m.is_a?(Hash) && m['year'] && Array(m['themes']).include?(slug) }
        newest_first = tagged.sort_by { |m| [-m['year'], -m['month'].to_i, order.index(m['key'])] }

        featured = newest_first.select { |m| m['featured'] }
        # Among recent papers, published work takes priority over preprints.
        recent = newest_first.reject { |m| m['featured'] }.select { |m| m['year'] >= cutoff }
                             .sort_by.with_index { |m, i| [m['venue'] == 'Preprint' ? 1 : 0, i] }
        picked = (featured + recent.first([max - featured.size, 0].max)).map { |m| m['key'] }

        theme['shown'] = newest_first.select { |m| picked.include?(m['key']) }
        theme['count'] = tagged.size
      end
    end

    private

    def load_bib(site)
      cfg = site.config['scholar'] || {}
      path = File.join(site.source, cfg['source'] || 'assets', cfg['bibliography'] || 'ref.bib')
      BibTeX.open(path).each_with_object({}) { |e, h| h[e.key.to_s] = e if e.respond_to?(:key) }
    end

    def clean(text)
      text.to_s.gsub(/[{}]/, '').gsub(/\s+/, ' ').strip
    end

    def month_number(month)
      return nil if month.nil?
      Date::ABBR_MONTHNAMES.index(month.to_s[0, 3].capitalize) || month.to_s.to_i
    end

    def venue(entry)
      return 'Preprint' if entry[:archiveprefix] || (entry[:booktitle].nil? && entry[:journal].nil?)
      name = clean(entry[:booktitle] || entry[:journal])
      VENUES.each do |pattern, label|
        m = name.match(pattern)
        return label || m[1] if m
      end
      name
    end
  end
end
