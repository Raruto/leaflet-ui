Feature: Leaflet UI integration

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
    When I rotate the map, open search and locate a position
    Then rotation, search and location are updated

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

  Scenario Outline: Turning off the default UI does not leave plugin controls behind
    Given a map using "<bundle>" with options:
      """
      {"disableDefaultUI":true,"gestureHandling":false,"visualClick":false}
      """
    Then no preset controls or base layers are added

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Disabled controls stay disabled
    Given a map using "<bundle>" with options:
      """
      {"zoomControl":false,"rotateControl":false,"scaleControl":false,"pegmanControl":false,"locateControl":false,"fullscreenControl":false,"layersControl":false,"minimapControl":false,"editInOSMControl":false,"loadingControl":false,"searchControl":false,"printControl":false,"resizerControl":false,"gestureHandling":false,"visualClick":false}
      """
    Then only the attribution control remains and handlers are disabled

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  @issue-5
  Scenario Outline: Custom configuration does not leak into subsequent maps
    Given a map using "<bundle>" with options:
      """
      {"mapTypeId":"missing","mapTypeIds":["terrain"],"zoomControl":{"position":"topleft"},"searchControl":{"querylang":"it","detectUserLang":false},"apiKeys":{"thunderforest":"first-map-test-key"}}
      """
    Then the selected fallback layer and custom options are applied
    And a new map keeps the original default options

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  @issue-10
  Scenario Outline: Disabling automatic CSS loading leaves custom plugins usable
    Given custom plugin assets are available
    And a map using "<bundle>" with options:
      """
      {"includeLeafletCSS":false,"includeLeafletUICSS":false,"plugins":["/regression-plugin.js","/regression-plugin.css"]}
      """
    Then custom JavaScript and CSS load without additional core stylesheets

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  @issue-19
  Scenario Outline: The documented dist import works without Node polyfills
    Given a map importing the browser bundle "<bundle>" through a bundler
    Then the UI controls use the page's Leaflet

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Scale and zoom limits follow the current view
    Given a map using "<bundle>" with options:
      """
      {"minZoom":4,"maxZoom":6}
      """
    Then the scale updates with zoom and zoom buttons respect limits

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Zoom buttons change the map zoom
    Given a map using "<bundle>"
    Then zoom buttons are visible and change the map zoom

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
