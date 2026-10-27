Feature: i18n plugin and controls

  Scenario Outline: Empty translations remain empty
    Given a map using "<bundle>"
    Then empty translations remain empty

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Translations support locale switching
    Given a map using "<bundle>"
    Then translations support locale switching and interpolation

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
