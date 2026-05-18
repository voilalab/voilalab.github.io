---
title: "Home"
layout: default
sitemap: false
permalink: /
---

<div id="homeid" class="col-sm-8 col-10">
## Welcome!

We're the **VOILA Lab at Georgia Tech**.
Our lab's research applies techniques from machine learning, signal processing, and optimization to solve inverse problems in computational imaging, including tasks in computer vision, medical imaging, and scientific imaging.

Please see our <a href="{{ site.url }}{{ site.baseurl }}/research">research areas page</a> for our lab's recent research, and our <a href="{{ site.url }}{{ site.baseurl }}/research">papers page</a> for an exhaustive listing of our lab's work.

We are grateful for support from <a href="https://www.nsf.gov/">NSF</a>, <a href="https://www.gtri.gatech.edu/">GTRI</a>, <span style="color: #ff0000">[TODO (Sara): others? Kent's postdoc source?]</span>


**Research areas:**
<div class="research-chips" markdown="0">
  <span class="chip">Computational imaging</span>
  <span class="chip">Machine learning</span>
  <span class="chip">Signal processing</span>
  <span class="chip">Inverse problems</span>
</div>

</div>
<div id="newsid" class="col-sm-4 col-12" >
<div>
{% for member in site.data.pi %}
<div class="jumbotron">
   <center>
	 <a href="{{site.url}}{{site.baseurl}}/team"><img src="{{site.url}}{{site.baseurl}}/images/teampic/{{ member.photo }}.jpeg" width="75%" style="display:inline-block; margin-left:auto; margin-right:auto; margin-bottom:5px;" alt="Photo of {{ member.name }}"/></a>
   <h5>{{ member.name }}</h5>
   <h6>{{ member.info }}</h6>
   <div style="margin-bottom:5px">
   {% if member.gt %}<a href="{{ member.gt }}" target="_blank" rel="noopener noreferrer" aria-label="View {{ member.name }}'s Georgia Tech profile"><i class="ai ai-archive-square ai-2x"></i></a> {% endif %}
   {% if member.email %}<a href="mailto:{{ member.email }}" target="_blank" rel="noopener noreferrer" aria-label="Email {{ member.name }}"><i class="fa fa-envelope-square fa-2x"></i></a> {% endif %}
   {% if member.cv %} <a href="{{ site.url }}{{ site.baseurl }}/{{ member.cv }}" target="_blank" rel="noopener noreferrer" aria-label="View {{ member.name }}'s CV"><i class="ai ai-cv-square ai-2x"></i></a> {% endif %}
   {% if member.scholar %} <a href="{{ member.scholar }}" target="_blank" rel="noopener noreferrer" aria-label="View {{ member.name }}'s Google Scholar profile"><i class="ai ai-google-scholar-square ai-2x"></i></a> {% endif %}
   {% if member.github %} <a href="{{ member.github }}" target="_blank" rel="noopener noreferrer" aria-label="View {{ member.name }}'s GitHub profile"><i class="fab fa-github-square fa-2x"></i></a> {% endif %}
   {% if member.researchgate %} <a href="{{ member.researchgate }}" target="_blank" rel="noopener noreferrer" aria-label="View {{ member.name }}'s ResearchGate profile"><i class="ai ai-researchgate-square ai-2x"></i></a> {% endif %}
  </div>
  </center>
</div>
{% endfor %}
</div>
</div>
<div class="col-sm-12">

<div class="jumbotron">
<h2>Thinking about joining the group?</h2>

In general, I plan to hire 1-2 PhD students per year, but that may fluctuate year to year. 

Please read the <a href="{{ site.url }}{{ site.baseurl }}/vacancies.html">Vacancies</a> page for detailed instructions before contacting me.
<br/><br/>
<strong>What strong applicants usually have:</strong> a solid foundation in linear algebra, optimization, signal processing, probability & statistics, and algorithms & data structures. Most project use Python (including GPU and autodiff libraries like PyTorch, JAX, and CuPy), but familiarity with lower-level languages like CUDA or C++ is a bonus
</div>

<div class="jumbotron" data-pagefind-ignore>
<h2>News</h2>
  {% for article in site.data.news limit:10%}
  <p>
    <span class="news-date">{{ article.display_date | default: article.date }}</span>
    <br/>
    {{ article.headline }}
  </p>
  {% endfor %}
  
  <h5><a href="{{ site.url }}{{ site.baseurl }}/allnews.html">... see all News</a></h5>
</div>
</div>
