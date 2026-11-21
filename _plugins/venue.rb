# Short venue labels ("NeurIPS", "CVPR") derived from the full bib venue name, so
# ref.bib (synced from Zotero) can keep the full names. Used by the research page
# (_plugins/research_papers.rb) and, on mobile, by the papers page
# (_layouts/bibtemplate.html, via the `short_venue` filter).
module Venue
  RULES = [
    [/\(([A-Z][A-Za-z0-9]+)(?: \d{4})?\)/, nil], # acronym in parentheses: "(CVPR)", "(ECCV 2026)"
    [/Neural Information Processing Systems/i, 'NeurIPS'],
    [/International Conference on Machine Learning/i, 'ICML'],
    [/Conference on Learning Representations/i, 'ICLR'],
    [/Machine Learning for Health/i, 'ML4H'],
    [/\AOPT \d{4}: Optimization for Machine Learning/i, 'OPT Workshop'],
    [/PLOS ONE/i, 'PLOS ONE'],
  ].freeze

  def self.clean(text)
    text.to_s.gsub(/[{}]/, '').gsub(/\s+/, ' ').strip
  end

  # The short label for a full venue name, or nil when no rule matches.
  def self.short(name)
    name = clean(name)
    RULES.each do |pattern, label|
      m = name.match(pattern)
      return label || m[1] if m
    end
    nil
  end

  module Filter
    # {{ entry.booktitle | default: entry.journal | short_venue }} -> "NeurIPS", or "" if unknown.
    def short_venue(name)
      Venue.short(name).to_s
    end
  end
end

Liquid::Template.register_filter(Venue::Filter)
