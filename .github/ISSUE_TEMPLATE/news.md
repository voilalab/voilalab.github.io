---
name: News entry 
about: You have new news other than arXiv or paper acceptance, e.g. talks, awards, etc.
labels: new
assignees: bburns-ds
---

# News entries

For a **new paper** or a **paper acceptance**, please use the dedicated paper templates instead — I'll write those news entries automatically. Use this template for anything else: talks, awards, grants, lab milestones, etc.

For each news entry that you would like to add, please copy and paste the following pattern:

```yaml
date:
headline:
```

Examples are shown [below](#example-entries). If you would like to add multiple news entries at a time, just copy and paste the template multiple times.

```yaml
date: January 1st, 1970
headline: We started counting epochs!

date: January 1st, 2006
headline: Another creative news entry for this template!
```

If you just want to _describe_ the news and have me (Ben) write the entry, then please use the following template to make it obvious that you want me to rewrite what you provided:

```yaml
date:
description:
```

## Links

For hyperlinks, you may use markdown formatting:

```md
[visible text](https://your-link.com)
```

or HTML:

```html
<a href='https://your-link.com' target='_self' rel='noopener noreferrer'>visible text</a>
```

## Example entries

### Written headlines

```yaml
date: March 15, 2026
headline: "Our lab was awarded a GTRI Fellowship!"
```

```yaml
date: May 28th, 2026
headline:  "Sara gave an invited talk at the <a href='https://link-to-workshop.com' target='_self' rel='noopener noreferrer'>XYZ workshop</a>"
```

### Description only

```yaml
date: May 29th, 2026
description: I just won XYZ fellowship: https://link-to-announcement.com
```
