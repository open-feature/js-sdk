Feature: Flag evaluation

  Scenario: Resolves boolean value
    Given A boolean flag called boolean-flag with value true exists
    When Flag is evaluated with default value false
    Then The resolved value should match the flag value

  Scenario: Resolves string value
    Given A string flag called string-flag with value #CC0000 exists
    When Flag is evaluated with default value #0000CC
    Then The resolved value should match the flag value

  Scenario: Resolves number value
    Given A number flag called number-flag with value 1 exists
    When Flag is evaluated with default value 2
    Then The resolved value should match the flag value