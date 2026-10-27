Feature: loading plugin and controls

  Scenario Outline: Loading indicator follows map loading events
    Given a map using "<bundle>"
    Then the loading indicator follows map loading events

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
