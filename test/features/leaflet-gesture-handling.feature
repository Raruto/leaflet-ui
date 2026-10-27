Feature: gesture-handling plugin and controls

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

  @issue-11 @issue-20 @issue-24
  Scenario Outline: Reported regional gesture locales are shipped and loaded
    Given locale requests are recorded
    And a map using "<bundle>" with options:
      """
      {"gestureHandlingOptions":{"locale":"<locale>"}}
      """
    Then gesture warnings use the shipped "<translation>" translation
    And locale "<locale>" loads without a missing-file response

    Examples:
      | bundle            | locale | translation |
      | leaflet-ui-src.js | en-US  | en          |
      | leaflet-ui-src.js | de-DE  | de          |
      | leaflet-ui-src.js | pl-PL  | pl          |
      | leaflet-ui.js     | en-US  | en          |
      | leaflet-ui.js     | de-DE  | de          |
      | leaflet-ui.js     | pl-PL  | pl          |

  @issue-11 @issue-20 @issue-24
  Scenario Outline: Unavailable locales fall back to the base language or English
    Given locale requests are recorded
    And a map using "<bundle>" with options:
      """
      {"gestureHandlingOptions":{"locale":"<locale>"}}
      """
    Then gesture warnings use the shipped "<translation>" translation
    And locale "<locale>" falls back to "<fallback>"

    Examples:
      | bundle            | locale | fallback | translation |
      | leaflet-ui-src.js | de-XX  | de       | de          |
      | leaflet-ui-src.js | zz-ZZ  | zz       | en          |
      | leaflet-ui.js     | de-XX  | de       | de          |
      | leaflet-ui.js     | zz-ZZ  | zz       | en          |

  @issue-8
  Scenario Outline: Custom gesture warning duration is honored
    Given a map using "<bundle>" with options:
      """
      {"gestureHandlingOptions":{"duration":850}}
      """
    Then gesture warnings expire after the configured 850 milliseconds

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
