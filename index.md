# Home

Landing page.

<h2>{{ site.data.navigation.list_title }}</h2>
<ul>
   {% for item in site.data.samplelist.list_content %}
      <li><a href="{{ item.url }}">{{ item.title }}</a></li>
   {% endfor %}
</ul>
