# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - link "Travel The World" [ref=e5]:
      - /url: index.php
    - link "home" [ref=e6]:
      - /url: home
  - generic [ref=e8]:
    - heading "Welcome to the Simple Travel Agency!" [level=1] [ref=e9]
    - paragraph [ref=e10]: The is a sample site you can test with BlazeMeter!
    - paragraph [ref=e11]:
      - text: Check out our
      - link "destination of the week! The Beach!" [ref=e12]:
        - /url: vacation.html
  - generic [ref=e13]:
    - heading "Choose your departure city:" [level=2] [ref=e14]
    - generic [ref=e15]:
      - combobox [ref=e16] [cursor=pointer]:
        - option "Paris"
        - option "Philadelphia"
        - option "Boston"
        - option "Portland" [selected]
        - option "San Diego"
        - option "Mexico City"
        - option "São Paolo"
      - paragraph
      - heading "Choose your destination city:" [level=2] [ref=e17]
      - combobox [ref=e18] [cursor=pointer]:
        - option "Buenos Aires"
        - option "Rome"
        - option "London"
        - option "Berlin"
        - option "New York"
        - option "Dublin"
        - option "Cairo" [selected]
      - paragraph
      - button "Find Flights" [ref=e20] [cursor=pointer]
```