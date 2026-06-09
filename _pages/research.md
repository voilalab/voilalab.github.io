---
title: "Research"
layout: gridlay
sitemap: false
permalink: /research/
---

## Research

Our lab's research applies techniques from machine learning, signal processing, and optimization to solve inverse problems in computational imaging, focusing on the following areas. See <a href="{{ site.url }}{{ site.baseurl }}/papers">our papers</a> for the full picture.

<div class="research-grid">

{% for theme in site.data.research.themes %}
<div class="research-card">
{% if theme.thumb %}<img src="{{ site.url }}{{ site.baseurl }}{{ theme.thumb }}" class="research-thumb" alt="{{ theme.alt | default: theme.title }}" loading="lazy">{% endif %}
<div class="research-body">
<h4 class="research-title" id="theme-{{ theme.title | slugify }}" data-pagefind-weight="4">{{ theme.title }}</h4>
<p class="research-desc">{{ theme.summary }}</p>
<ul class="research-bullets">
{% for b in theme.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
<div class="research-footer" markdown="0">
{% if theme.papers %}<span class="research-pubs"><i class="fas fa-file-alt"></i> {% for paper in theme.papers %}<a href="{{ site.url }}{{ site.baseurl }}/papers/#{{ paper.key }}">{{ paper.text }}</a>{% unless forloop.last %} · {% endunless %}{% endfor %}</span>{% endif %}
{% if theme.papers %}{% capture codelinks %}{% for paper in theme.papers %}{% assign meta = site.data.papers[paper.key] %}{% if meta.code %}<a href="{{ meta.code }}" target="_blank" rel="noopener noreferrer" class="research-link"><i class="fab fa-github"></i> {{ paper.text }}</a>{% endif %}{% endfor %}{% endcapture %}{% if codelinks != "" %}<div class="research-links">{{ codelinks }}</div>{% endif %}{% endif %}
</div>
</div>
</div>
{% endfor %}

</div>
