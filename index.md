# Home

Landing page.

{% include navigation.html %}

<h2>{{ site.data.navigation.list_title }}</h2>
<ul>
   {% for item in site.data.navigation.list_content %}
      <li><a href="{{ item.url }}">{{ item.title }}</a></li>
   {% endfor %}
</ul>

## Disclaimer
This product uses the openFEC API but is not endorsed or certified by the Federal Election Commission (FEC).
