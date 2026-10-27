@browser
Feature: Optional plugins and integration boundaries
  Scenario Outline: Exported maps are real PNG images and restore the UI
    Given a map using "<bundle>" with options:
      """
      {"mapTypeIds":[],"minimapControl":false,"printControl":{"sizeModes":["Current","A4Landscape","A4Portrait"]}}
      """
    When I export the map in "<size>" format
    Then a PNG of <width> by <height> pixels is downloaded
    And printing restores the map size, position and controls

    Examples:
      | bundle            | size        | width | height |
      | leaflet-ui-src.js | CurrentSize | 600   | 400    |
      | leaflet-ui-src.js | A4Landscape | 1045  | 715    |
      | leaflet-ui-src.js | A4Portrait  | 715   | 1045   |
      | leaflet-ui.js     | CurrentSize | 600   | 400    |
      | leaflet-ui.js     | A4Landscape | 1045  | 715    |
      | leaflet-ui.js     | A4Portrait  | 715   | 1045   |

  Scenario Outline: Resize handles update the container and Leaflet size
    Given a map using "<bundle>" with options:
      """
      {"resizerControl":{"direction":"<direction>"},"gestureHandling":false}
      """
    When I drag the resize handle by 60 pixels horizontally and 40 vertically
    Then the map grows by <dx> pixels horizontally and <dy> vertically
    And disabling the resizer prevents further resizing

    Examples:
      | bundle            | direction | dx | dy |
      | leaflet-ui-src.js | e         | 60 | 0  |
      | leaflet-ui-src.js | s         | 0  | 40 |
      | leaflet-ui-src.js | se        | 60 | 40 |
      | leaflet-ui.js     | e         | 60 | 0  |
      | leaflet-ui.js     | s         | 0  | 40 |
      | leaflet-ui.js     | se        | 60 | 40 |

  Scenario Outline: Gesture handling protects page scrolling
    Given a map using "<bundle>"
    Then scrolling without a modifier warns without zooming
    And control-scroll zooms the map
    And fullscreen suspends gestures and restores them on exit
    And disabling gesture handling removes the warning behavior

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Touch gestures require two fingers
    Given a map using "<bundle>"
    Then one finger warns and two fingers permit map dragging
    And touches on controls do not show gesture warnings

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Rotation controls change the bearing and keep coordinates consistent
    Given a map using "<bundle>" with options:
      """
      {"rotateControl":{"closeOnZeroBearing":false},"gestureHandling":false}
      """
    When I drag the rotation control through 45 degrees
    Then the bearing and rotation arrow are updated
    And rotated map coordinates round-trip correctly

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Map clicks show temporary feedback, control clicks do not
    Given a map using "<bundle>" with options:
      """
      {"visualClick":{"removeTimeout":1000},"gestureHandling":false}
      """
    Then map clicks and context clicks show feedback that disappears
    And control clicks and disabled visual feedback create no marker

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Pegman uses the real GoogleMutant layer with a simulated Google service
    Given a simulated Google Maps service
    And a map using "<bundle>" with options:
      """
      {"pegmanControl":true,"gestureHandling":false}
      """
    When I activate Street View coverage
    Then GoogleMutant synchronizes with the Leaflet map
    And GoogleMutant renders tiles received from the simulated service
    When I select a Street View location
    Then the panorama and Pegman marker show the selected location
    And closing Street View removes coverage and the marker
    And dragging Pegman onto the map opens a panorama
    And a location without Street View reports a warning

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Pointable is loaded as a custom plugin and reads real canvas pixels
    Given a map using "<bundle>" with options:
      """
      {"plugins":["/node_modules/leaflet-pointable/leaflet-pointable.js"],"gestureHandling":false,"rotate":false,"minimapControl":false}
      """
    When I add a pointable canvas overlay
    Then opaque pixels are clickable and transparent pixels are not
    And removing the overlay unregisters it
    And custom plugin scripts are shared between maps

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Browser geolocation can be started and stopped from the control
    Given a map using "<bundle>"
    Then the locate button displays the browser position and stops on a second click

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

  Scenario Outline: Native fullscreen restores the map and control state
    Given a map using "<bundle>" with options:
      """
      {"fullscreenControl":{"forcePseudoFullscreen":false}}
      """
    Then native fullscreen can be entered and exited

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

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

  Scenario Outline: Search and geolocation failures leave the UI usable
    Given a map using "<bundle>"
    Then an empty search displays no results without moving the map
    And a geolocation denial is reported and locating stops
    And translations support locale switching and interpolation

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
