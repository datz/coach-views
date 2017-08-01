angular.module('responsive.coaches').controller("singleSelectPtz", ["$scope", "$element", "$timeout", "$resource", "coachUtils", "Coach", function ($scope, $element, $timeout, $resource, coachUtils, Coach) {
    "use strict";
    angular.extend($scope, new Coach($scope, $element, $timeout));

    /**
     * Contains results from the binding value or the selection service; it feeds the select drop-down
     * @memberOf SingleSelectController
     */
    $scope.options = [];

    /**
     * Contains results from selection service, if any
     * @memberOf SingleSelectController
     */
    $scope.selectionServiceList = [];

    /**
     * toggles the select list open and closed
     */
    $scope.toggler = {toggle: false};

    //use BPM control for desktop Chrome, otherwise check for feature
    var agent = window.navigator.userAgent;
    if (agent.indexOf("Chrome") !== -1 && agent.indexOf("Android") === -1) {
        $scope.nativeSelect = false;
    } else {
        /**
         * Need a better way to check for native select dropdown support, for now, we'll assume that if there is a native
         * date picker, then there will be native 'select' support
         */
        /*global Modernizr*/
        $scope.nativeSelect = Modernizr.inputtypes['datetime-local'];
    }

    /**
     * Helper function to remove duplicate entries from a selection list
     */
    var removeDuplicates = function(originalList) {
        var i, j, found, retList = [];

        for (i=0; i<originalList.length; i++) {
            found = false;
            for (j=0; j<retList.length; j++) {
                if ($scope.getItemName(retList[j]) === $scope.getItemName(originalList[i])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                retList.push(originalList[i]);
            }
        }

        return retList;
    };

    /**
     * Determines whether or not the selectionList configuration option should be used to populate the list.
     * @returns {boolean} True if the selectionList should be used.
     * @memberOf MultipleSelectController
     */
    $scope.useSelectionList = function() {
        return (!!$scope.context.options && !!$scope.context.options.selectionList && !!$scope.context.options.selectionList.property) ? true : false;
    };

    /**
     * Retrieves the name of the item, depending on its type. If the item is a string, the name is the string itself;
     * if the item is an object, the name is retrieved by referencing its name property (which is literally called "name"
     * for "NameValuePair" objects, or whatever the value of the "displayNameProperty" configuration option is for user-defined types).
     * If the object does not have the name property, the name returned will be the result of the item's "toString()" function.
     *
     * If the item is null or undefined, it will be returned as-is.
     *
     * @param {object} item The object whose name is being queried
     * @param {boolean} display Specifies if the value is only used for display (empty will be replaced by dashes)
     * @returns {string} The name of the item
     */
    $scope.getItemName = function(item, display) {
        var name = coachUtils.getItemName(item, $scope);

        if (display === true) {
            if (name.trim() === "") {
                name = "------";
            }
        }
        return name;
    };

    /**
     * Retrieves the value of the item, depending on its type. If the item is a string, the value is the string itself;
     * if the item is an object, the value is retrieved by referencing its value property (which is literally called "value"
     * for "NameValuePair" objects, or whatever the value of the "valueProperty" configuration option is for user-defined types).
     * If the object does not have the value property, the value returned will be null.
     *
     * If the item is null or undefined, it will be returned as-is.
     *
     * @param {object} item The object whose value is being queried
     * @returns {string} The value of the item
     * @memberOf SingleSelectController
     */
    $scope.getItemValue = function(item) {
        if ($scope.valProp === undefined) {
            $scope.valProp = $scope.getOption("valueProperty", "value");
        }
        if ($scope.valProp === undefined) {
            $scope.valProp = null;
        }

        return coachUtils.getItemValue(item, $scope);
    };

    /**
     * Updates the list of options that are displayed by the control. If the "selectionList" configuration option is specified,
     * its value will be used to feed the option list; otherwise, the result of the selection service execution will be used.
     * If the "disableSort" configuration option is true, the option items will be displayed in the same order given; otherwise,
     * the option items will be sorted alphabetically before being displayed. Finally, the value selected in the control will
     * be updated (so that if there is a value set on the binding and said value exists on the option list, it will be chosen
     * in the control).
     *
     * This function is invoked due to a change in one of the configuration options or when the selection service callback has been invoked.
     *
     * @param {object} optionName The name of the option that caused the option list to be updated (used for diagnostic purposes)
     * @memberOf SingleSelectController
     */
    $scope.updateOptions = function(optionName) {
        console.log('LLAMANDO updateOptions', optionName);
        var selectionList = $scope.getOption("selectionList", undefined),
            originalList = [],
            displayList = [];
        var	selectedIndex = !!selectionList ? selectionList.get('listSelectedIndex') : -1;

        // if the option list is going to be regenerated, we must clear the selection so that the new
        // option is one of the new list items
        $scope.selectedValue = null;

        if (selectionList && selectionList.items) {
            originalList = selectionList.items;
        } else if ($scope.selectionServiceResource) {
            originalList = $scope.selectionServiceList;
        }

        // display default values in web PD preview mode
        if ($scope.designer &&originalList.length < 1) {
            originalList[0] = $scope.messages.defaultOption2;
            originalList[1] = $scope.messages.defaultOption1;
            originalList[2] = $scope.messages.defaultOption3;
        }

        // Clone the original list to keep it unsorted
        displayList = removeDuplicates(originalList.slice(0));

        // Sorting function that compares the string values or labels, in the case of objects
        var sortFunction = function(a, b) {

            if (angular.isNumber(a) && angular.isNumber(b)) {
                a = parseFloat(a, 10);
                b = parseFloat(b, 10);

                if (a < b) {
                    return -1;
                }
                if (b < a) {
                    return 1;
                }
            } else if (angular.isDate(a) && angular.isDate(b)) {
                if (a < b) {
                    return -1;
                }
                if (b < a) {
                    return 1;
                }
            } else {
                var nameA = $scope.getItemName(a),
                    nameB = $scope.getItemName(b);

                if (nameA && nameB) {
                    return nameA.localeCompare(nameB);
                }
            }

            return 0;
        };

        if (false === $scope.getOption("disableSort", false)){
            displayList = displayList.sort(sortFunction);
        }

        //need to copy the contents to prevent pollution of the binding data
        $scope.options = angular.copy(displayList);

        // since the list of options has been modified, we may need to update the selected
        // value based on the value assigned to the output binding
        if($scope.context.binding){
            //if the options list is empty, we should reset the binding
            if ($scope.initialized === true && $scope.options && $scope.options.length === 0) {
                $scope.bindingValue = null;
            }
            $scope.updateSelectedValue($scope.context.binding.get('value'));
        } else if(!$scope.context.binding && selectedIndex >= 0){
            $scope.updateSelectedValue(originalList[selectedIndex]);
        }
    };

    /**
     * Sets up the execution of the selection service, passing it the input text specified in the "selectionServiceInputText"
     * configuration option, if defined.
     *
     * The invocation is scheduled on a 50ms timer in order to coalesce several changes to the service input text into a single
     * invocation. If multiple requests to invoke the service come within the 50ms window, the previous invocation is cancelled
     * and a new one is scheduled: that way we make sure there is only ever one outstanding invocation at a time.
     *
     * A call is made using BPM service, and results are retrieved asynchronously. When the results
     * are ready to be read, they are assigned to a variable on the scope and the updateOptions() function is invoked to refresh
     * the list of options on the control.
     *
     * This function is invoked when the "selectionService" configuration option is initialized (at configuration time) and every time
     * the value of the "selectionServiceInputText" configuration option is modified at runtime.
     *
     * @param {object} optionName The name of the option that caused the service to be invoked (used for diagnostic purposes)
     * @memberOf SingleSelectController
     */
    $scope.callSelectionService = function(optionName) {

        // If a timeout is already pending, cancel it so we do not have multiple concurrent ones
        if ($scope.serviceTimer) {
            $timeout.cancel($scope.serviceTimer);
        }

        if (!$scope.context.options.selectionService) {
            return;
        }

        // Schedule the invocation of the service for a future date
        $scope.serviceTimer = $timeout(function() {
            var argOptionName = "selectionServiceInputText",
                serviceUrl,
                serviceInputText;

            serviceUrl = $scope.context.options !== null ? $scope.context.options.selectionService.url : undefined;

            serviceInputText = $scope.context.options && $scope.context.options[argOptionName] && $scope.context.options[argOptionName].get("value") !== undefined ?
                $scope.context.options[argOptionName].get("value") : undefined;

            if (serviceUrl) {
                $scope.selectionServiceResource = function(textValue) {
                    var input = {text: textValue};
                    var serviceArgs = {
                        params: JSON.stringify(input),
                        load: function(data) {
                            $scope.$evalAsync(function(){
                                $scope.selectionServiceList = (!!data && !!data.results && !!data.results.items) ? data.results.items : [];
                                $scope.initialized = true;
                                $scope.updateOptions(optionName);
                            });
                        },
                        error: function(e) {
                            $scope.context.log($scope.messages.ajaxServiceError + "selectionService", e);
                        }
                    };
                    $scope.context.options.selectionService(serviceArgs);
                };
                $scope.selectionServiceResource(serviceInputText);
            } else {
                $scope.updateOptions(optionName);
            }
        }, 50);
    };

    /**
     * Updates the value of the output binding if the option list has already been initialized (which signals that the control
     * is ready to select a value and update its output binding).
     *
     * The selected value (i.e. the item currently selected in the control) is cleaned up (i.e. any Angular-specific internal
     * properties that may have been added are removed) before being assigned to the output binding.

     * @memberOf SingleSelectController
     */
    $scope.updateOutputBinding = function() {
        if ($scope.options && $scope.options.length) {
            var obj = $scope.cleanUpObject($scope.selectedValue);
            var objType = typeof(obj);
            if (objType === 'object') {
                for(var key in obj){
                    if(key.substr(0,2) === "$$"){
                        delete obj[key];
                    }
                }
            }
            if ( objType === 'object') {
                $scope.bindingValue = $scope.valProp ?  obj[$scope.valProp] : obj ;
            } else {
                $scope.bindingValue = obj;
            }
            // $scope.bindingValue = obj;
            console.warn('update output binding', $scope.bindingValue);
        }
    };

    /**
     * Updates the item that is currently selected on the control. Processing only occurs if the list of options has been
     * initialized and there is a variable bound to the output binding.
     *
     * The value passed to the function is searched within the options in the control (first, by finding an option with a
     * matching value, if available; and if that fails, by finding an option with a matching name, if available). Note
     * that it may not be possible to retrieve a value or a name from the option in the case where the option is of a
     * user-defined type and the "valueProperty" or "displayNameProperty" configuration options do not specify properties
     * that exist on the object.
     *
     * Aside from keeping track of the value of the selected item (or null, if the selected item could not be found
     * within the list of options), the output binding is updated to reflect the same value.
     *
     * @param {object} selectedItem The value of the item currently selected in the control
     * @memberOf SingleSelectController
     */
$scope.updateSelectedValue = function(selectedItem) {
    var i,
        selectedItemValue,
        selectedItemName,
        foundOption = null;

    // we only proceed if the options array has been initialized (to avoid clearing out the bindings prematurely) and
    // if the variable in question has been defined (to avoid processing changes when no variable is bound to the output binding)
    if ($scope.options && 0 !== $scope.options.length && undefined !== selectedItem) {
        // if a value has been selected, attempt to find it in the options array
        if (selectedItem) {

            if (typeof(selectedItem) === 'object') {
                selectedItemValue = $scope.getItemValue(selectedItem);
                selectedItemName = $scope.getItemName(selectedItem);

                console.log('update selected value value', selectedItemValue);
                console.log('update selected name value', selectedItemName);

                for (i = 0; i < $scope.options.length; i += 1) {
                    // if the value property was specified, check it first
                    if (selectedItemValue && $scope.getItemValue($scope.options[i])) {
                        if (selectedItemValue === $scope.getItemValue($scope.options[i])) {
                            foundOption = $scope.options[i];
                            break;
                        }
                    } else if (selectedItemName && $scope.getItemName($scope.options[i])) {
                        // if the name property was specified, check it as a fall-back option
                        if (selectedItemName === $scope.getItemName($scope.options[i])) {
                            foundOption = $scope.options[i];
                            break;
                        }
                    }
                }
            } else {
                for (i = 0; i < $scope.options.length; i += 1) {
                    var op = $scope.options[i];
                    if ($scope.getItemValue(op) === selectedItem) {
                        foundOption = op;
                        break;
                    }
                }
            }


        }

        // this will either set the selected value to the found option or to null
        $scope.selectedValue = foundOption;
        console.log('selected value', $scope.selectedValue);

        // make sure the output binding is in sync with the selected value
        $scope.updateOutputBinding();
    }
};

    /**
     * This function is called whenever a new option is selected on the control. It updates the selected value state
     * variable as well as the output binding.
     *   *
     * @param {object} selectedValue The value of the item that was just selected on the control
     * @memberOf SingleSelectController
     */
    $scope.selected = function(selectedValue) {
        var selectionList = $scope.getOption("selectionList", undefined);

        // referente a la lista de items seleccionados
        if(!!selectionList && !$scope.context.binding){
            var index = -1, i = 0;
            for (i=0; i<selectionList.items.length; i++) {
                if (angular.equals(selectionList.items[i], selectedValue)) {
                    index = i;
                    $scope.active = {descendant: "single-select-option-" + i};
                    break;
                }
            }
            if (index !== -1) {
                $scope.context.options.selectionList.get("value").set("listAllSelectedIndices", [index]);
            }
        }

        $scope.selectedValue = selectedValue;
        console.warn('selected value', $scope.selectedValue);

        // make sure the output binding is in sync with the selected value
        // LA ESPECIAL
        $scope.updateOutputBinding();

        $scope.toggler.toggle = false;
        if ($scope.parentContentBoxes !== undefined) {
            $scope.parentContentBoxes.removeClass("showOverflow");
        }
    };

    if($scope.useSelectionList() || $scope.designer) {
        //set the initialized flag unless we first need to call the service
        $scope.initialized = true;
    }

    $scope.watchOption("selectionList", undefined, function() {
        $scope.updateOptions("selectionList");
    }, true);

    $scope.watchOption("selectionService", undefined, function() {
        if(!$scope.useSelectionList() && !$scope.designer) {
            $scope.callSelectionService("selectionService");
        }
    }, true);

    $scope.watchOption("selectionServiceInputText", undefined, function() {
        if(!$scope.useSelectionList() && !$scope.designer) {
            $scope.callSelectionService("selectionServiceInputText");
        }
    }, false);

    $scope.watchOption("displayNameProperty", "name", function() {
        $scope.updateOptions("displayNameProperty");
    }, true);
    $scope.watchOption("valueProperty", "value", function() {
        $scope.updateOptions("valueProperty");
    }, true);

    $scope.watchOption("disableSort", false, function() {
        $scope.updateOptions("disableSort");
    }, true);

    $scope.deepWatchBinding(function() {
        console.warn('cambio deep binding');
        $scope.updateOptions("binding");
    });

    $scope.watchOption("textSize", "default");

    /**
     * This function is called whenever the output binding's value changes on the context (e.g. if another control bound
     * to the same variable changes its value). This causes the binding value scope variable to be changed to match
     * its new value on the context, and the selected value is updated on the control.
     *
     * @param {object} newValue The value the output binding was just changed to
     * @memberOf SingleSelectController
     */
    $scope.onContextChange = function(newValue) {
        if (newValue || $scope.bindingValue) {
            $scope.bindingValue = newValue;
        }

        $scope.updateSelectedValue(newValue);
    };
}]);
