Feature: layers plugin and controls

  @issue-1 @issue-21 @issue-23
  Scenario Outline: Custom providers work without the preset layer selector
    Given a map using "<bundle>" with options:
      """
      {"mapTypeId":"custom","mapTypeIds":["custom"],"mapTypes":{"custom":{"name":"Custom provider","url":"/tiles/{z}/{x}/{y}.png?key={apiKey}","options":{"apiKey":"test-key","attribution":"Custom attribution"}}},"layersControl":false,"minimapControl":false}
      """
    Then the custom provider is selected without a preset layer control
    And native layers and a native layer selector work alongside the UI

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Satellite detail restores the previous base layer
    Given a map using "<bundle>" with options:
      """
      {"mapTypeId":"terrain"}
      """
    When I zoom into satellite detail and back out
    Then the previous base layer is restored

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
