@browser
Feature: Leaflet UI controls
  Scenario Outline: Test pages switch Leaflet versions without losing the URL state
    Given the test page "<page>" is open
    Then Leaflet "1.9.4" is loaded with <maps> test maps
    When I select Leaflet "2.0.0-alpha.1"
    Then Leaflet "2.0.0-alpha.1" is loaded with <maps> test maps
    When I select Leaflet "1.9.4"
    Then Leaflet "1.9.4" is loaded with <maps> test maps

    Examples:
      | page               | maps |
      | index.html         | 1    |
      | multiple-maps.html | 3    |
      | map.html           | 0    |

  Scenario Outline: Controls work with each browser bundle
    Given a map using "<bundle>"
    Then the UI controls use the page's Leaflet
    And zoom buttons are visible and change the map zoom
    When I enter and exit fullscreen
    Then the map has left fullscreen
    When I rotate the map, open search and locate a position
    Then rotation, search and location are updated
    When I search for a place
    Then the map moves to the search result
    When I switch base layers and click the minimap
    Then the base layer, minimap and attribution stay synchronized
    When I zoom into satellite detail and back out
    Then the previous base layer is restored
    And the loading indicator follows map loading events
    And the edit link opens the current map position
    And empty translations remain empty

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Fullscreen works without zoom controls
    Given a map using "<bundle>" without zoom controls
    Then there is one fullscreen button and no zoom buttons
    When I enter and exit fullscreen
    Then the map has left fullscreen

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Controls retain their layout on desktop and mobile
    Given a map using "<bundle>"
    When I view the map at <width> pixels with "<controls>" controls
    Then the layer selector retains its pre-1.9 dimensions
    And the footer retains its pre-1.9 typography
    And the controls fit the map and the minimap remains clickable

    Examples:
      | bundle            | width | controls |
      | leaflet-ui-src.js | 1280  | touch    |
      | leaflet-ui-src.js | 1280  | mouse    |
      | leaflet-ui-src.js | 375   | touch    |
      | leaflet-ui.js     | 1280  | touch    |
      | leaflet-ui.js     | 1280  | mouse    |
      | leaflet-ui.js     | 375   | touch    |

  Scenario Outline: Maps keep their own layers and control configuration
    Given a map using "<bundle>"
    When I add a second map with different UI options
    Then both maps keep independent layers and controls
    And removing one map leaves the other usable

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
