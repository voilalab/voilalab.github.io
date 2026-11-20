---
title: "Research"
layout: gridlay
sitemap: false
permalink: /research/
---

## Research

Our lab's research applies techniques from machine learning, signal processing, and optimization to solve inverse problems in computational imaging, focusing on the following areas. Each area lists selected work; see <a href="{{ site.url }}{{ site.baseurl }}/papers">our papers</a> for everything.

<div class="research-grid">

{% for theme in site.data.research.themes %}
<div class="research-card">
{% if theme.thumb %}<img src="{{ site.url }}{{ site.baseurl }}{{ theme.thumb }}" class="research-thumb" alt="{{ theme.alt | default: theme.title }}" loading="lazy">{% endif %}
<div class="research-body">
<h4 class="research-title" id="theme-{{ theme.title | slugify }}" data-pagefind-weight="4">{{ theme.title }}</h4>
{% if theme.summary %}<p class="research-desc">{{ theme.summary }}</p>{% endif %}
{% if theme.bullets %}
<ul class="research-bullets">
{% for b in theme.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
{% endif %}
{% if theme.shown.size > 0 %}
<div class="research-footer" markdown="0">
<!--<span class="research-papers-label">Selected work</span>-->
<ul class="research-papers">
{% for p in theme.shown %}
<li class="research-paper">
<a class="research-paper-name" href="{{ site.url }}{{ site.baseurl }}/papers/#{{ p.key }}">{{ p.short | default: p.title }}</a>
<div class="research-paper-meta"><span class="research-paper-venue">{{ p.venue }} {{ p.year }}</span>{% if p.paper_url %}<a class="research-paper-icon" href="{{ p.paper_url }}" target="_blank" rel="noopener noreferrer" title="Paper" aria-label="{{ p.short | default: p.title }} paper"><i class="fas fa-file-alt"></i></a>{% endif %}{% if p.project %}<a class="research-paper-icon" href="{{ p.project }}" target="_blank" rel="noopener noreferrer" title="Project page" aria-label="{{ p.short | default: p.title }} project page"><i class="fas fa-link"></i></a>{% endif %}{% if p.code %}<a class="research-paper-icon" href="{{ p.code }}" target="_blank" rel="noopener noreferrer" title="Code" aria-label="{{ p.short | default: p.title }} code"><i class="fab fa-github"></i></a>{% endif %}</div>
{% if p.summary %}<p class="research-paper-summary">{{ p.summary }}</p>{% endif %}
</li>
{% endfor %}
</ul>
<a class="research-all" href="{{ site.url }}{{ site.baseurl }}/papers/?theme={{ theme.slug }}">All {{ theme.count }} papers on this topic <i class="fas fa-arrow-right"></i></a>
</div>
{% endif %}
</div>
</div>
{% endfor %}

</div>
