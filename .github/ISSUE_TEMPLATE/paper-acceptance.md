---
name: Paper acceptance
about: A paper of ours has been accepted to a venue (conference, journal, workshop)
labels: update
assignees: bburns-ds
---

# Paper acceptance

A paper of ours has been accepted somewhere. You don't need to know whether it's already
on the site — I'll sort that out. You just have to give me (i) the paper info and (ii) a link to your code.

## Paper info

Just give me **one** of the two options below, and I'll update the website and write the corresponding news entry.

### Option 1 — venue page link (preferred)

Paste a link to the paper's abstract page or the official PDF from the venue's website. See the [link guide](#link-guide) for examples. Provide this information as follows:

```yaml
acceptance-date:
link:
```

### Option 2 — paper details

If you don't have a official link from the venue, fill in all four so that I can find it:

```yaml
acceptance-date:
title:    # full title
authors:  # full author list, in order
venue:    # venue name, e.g. "NeurIPS", "CVPR", etc.
year:
```

## Code

If there's a public code repository, paste the link:

```yaml
code:
```

## Research area(s)

Check (`[ ] -> [x]`) every theme this paper belongs to (at least one). These map to the sections on the [research page](https://voilalab.github.io/research/):

- [ ] 3D reconstruction and representation
- [ ] Medical imaging
- [ ] Machine learning foundations
- [ ] Generative priors for inverse problems
- [ ] Identifying and tackling distribution shift
- [ ] Other / not sure (describe below)

```yaml
notes:
```


---

## Link guide

Here are the types of links which I can work with. The PDF links are usually the easiest to find because they are the most viewed, and so search engines love them. If a venue does not appear or there is an alternative page with the desired information (`bibtex`, official conference PDF, etc), you may use it as the link and I can add it to the template.

### arXiv

- pdf:  `https://arxiv.org/pdf/2112.05131`
- html: `https://arxiv.org/html/2112.05131`
- abs:  `https://arxiv.org/abs/2112.05131`

### CVPR

- pdf: `https://openaccess.thecvf.com/content/CVPR2022/papers/Fridovich-Keil_Plenoxels_Radiance_Fields_Without_Neural_Networks_CVPR_2022_paper.pdf`
- abs: `https://openaccess.thecvf.com/content/CVPR2022/html/Fridovich-Keil_Plenoxels_Radiance_Fields_Without_Neural_Networks_CVPR_2022_paper.html`

### OpenReview

- pdf:   `https://openreview.net/pdf?id=OZljvntsto`
- forum: `https://openreview.net/forum?id=OZljvntsto`

### NeurIPS

You can alternatively use the [OpenReview page](#openreview) instructions.

- pdf: `https://proceedings.neurips.cc/paper_files/paper/2022/file/306264db5698839230be3642aafc849c-Paper-Conference.pdf`
- abs: `https://proceedings.neurips.cc/paper_files/paper/2022/hash/306264db5698839230be3642aafc849c-Abstract-Conference.html`
