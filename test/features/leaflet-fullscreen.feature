Feature: fullscreen plugin and controls

  @issue-22
  Scenario Outline: Fullscreen works without zoom controls
    Given a map using "<bundle>" without zoom controls
    Then there is one fullscreen button and no zoom buttons
    When I enter and exit fullscreen
    Then the map has left fullscreen

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

  Scenario Outline: Fullscreen can be entered and exited
    Given a map using "<bundle>"
    When I enter and exit fullscreen
    Then the map has left fullscreen

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
