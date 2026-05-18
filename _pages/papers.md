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


<div class="jumbotron">
{% bibliography --group_by year --group_order descending %}
</div>

<script>
document.addEventListener('click', function (event) {
    var btn = event.target.closest('.bib-toggle');
    if (!btn) return;
    var panel = document.getElementById(btn.dataset.bibTarget);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});
</script>
