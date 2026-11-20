---
title: "Papers"
layout: gridlay
sitemap: false
permalink: /papers/
years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
---

<style>
.jumbotron{
    padding:3%;
    padding-bottom:10px;
    padding-top:10px;
    margin-top:10px;
    margin-bottom:30px;
}
</style>

## Archival Publications

<p class="text-muted" style="font-size:0.9em;">* denotes equal contribution</p>

<p class="papers-filter-note" id="papers-filter-note" hidden></p>


<div class="jumbotron">
{% bibliography --group_by year --group_order descending %}
</div>

<script>
// /papers/?theme=<slug> (linked from the research page) shows only papers tagged
// with that theme in _data/papers.yml.
(function () {
    var themes = {
{%- for theme in site.data.research.themes %}
        {{ theme.slug | jsonify }}: {{ theme.title | jsonify }}{% unless forloop.last %},{% endunless %}
{%- endfor %}
    };
    var slug = new URLSearchParams(window.location.search).get('theme');
    if (!slug || !themes.hasOwnProperty(slug)) return;
    document.querySelectorAll('.pub-entry').forEach(function (entry) {
        var tags = (entry.dataset.themes || '').split(' ');
        if (tags.indexOf(slug) === -1) entry.closest('li').hidden = true;
    });
    document.querySelectorAll('ol.bibliography').forEach(function (list) {
        if (list.querySelector('li:not([hidden]) .pub-entry')) return;
        list.hidden = true;
        var heading = list.previousElementSibling;
        if (heading && heading.matches('h2.bibliography')) heading.hidden = true;
    });
    var note = document.getElementById('papers-filter-note');
    note.textContent = 'Showing papers on ' + themes[slug] + '.';
    var all = document.createElement('a');
    all.href = window.location.pathname;
    all.textContent = 'Show all papers';
    note.appendChild(all);
    note.hidden = false;
})();

document.addEventListener('click', function (event) {
    var btn = event.target.closest('.bib-toggle');
    if (!btn) return;
    var panel = document.getElementById(btn.dataset.bibTarget);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});
</script>
