/**
 * flowEditor.jsx
 */

/**
 * Heirarchy
 *
 * > FlowEditorFields (houses all field containers and form controls)
 * | Passes down: 
 * |   field object, onRemove handler for the configurator, key (time-based input key), index (index in fields object)
 * ==> FlowEditorFieldConfigurator (single field configuration control area)
 *   | Passes down:
 *   |   field type, onChange handler
 *   ==> FlowEditorFieldConfiguratorSettingsDialog
 *
 * Properties:
 *  - stageName: current name of this stage
 *  - stageType: current type of this stage
 *  - fields: currently saved fields
 *  - handleSubmit: handler for submitting fields to server
 */

var FlowEditor = React.createClass({displayName: "FlowEditor",

	/*
	 * Initial container state: has no fields
	 */
	getInitialState: function() {
		return {
			fields: {},
			fieldValidities: {},
			invalidCount: 0,
			isValid: true,
			fieldsRemoved: [],
		};
	},

	/*
	 * Add prop fields to state before mount
	 */
	componentWillMount: function() {
		this.setState({ fields: this.props.fields }, function() {
			this.checkContainerValidity();
		}.bind(this));
	},


	/*
	 * Add a new field to the container
	 */
	handleAddNewField: function() {
		var fields = this.state.fields;
		var fieldValidities = this.state.fieldValidities;
		var key = new Date().getTime();

		fields[key] = FlowEditor.getDefaultFieldState(this.props.stageType); // Default settings for a new input
		fieldValidities[key] = false; // Input defaults to invalid

		this.setState({ fields: fields, fieldValidities: fieldValidities });

		// Since we added a field, we should re-check validity of the container
		this.checkContainerValidity();
	},

	/*
	 * Remove a field from the container (requires key)
	 */
 	handleRemoveField: function(key) {
		var fields = this.state.fields;
		var fieldValidities = this.state.fieldValidities;
		var fieldsRemoved = this.state.fieldsRemoved;

		if(fields.hasOwnProperty(key)) {
			fieldsRemoved.push( (this.refs[key].state.name.length > 0 ? this.refs[key].state.name : '<em>Untitled field</em>' ) + " &nbsp; <span class='label label-default'>" + key + "</span>");
			delete fields[key];
		}
		if(fieldValidities.hasOwnProperty(key)) {
			delete fieldValidities[key];
		}

		this.setState({ fields: fields, fieldValidities: fieldValidities, fieldsRemoved: fieldsRemoved });

		// Since we removed a field, we should re-check validity of the container
		this.checkContainerValidity();
 	},

 	handleConfigUpload: function(event) {
		var reader = new FileReader();
		var file = event.target.files[0];

		reader.onload = function(upload) {
			console.log("Reader onload return upload target result:");
			console.log(upload.target.result);

			var fields = JSON.parse(atob(upload.target.result.split(",")[1]));
			if(fields) {
				this.setState({ 
					fields: fields, 
				});
			}
		}.bind(this);

		reader.readAsDataURL(file);
 	},

 	/*
 	 * Check the validity of a field object
 	 */
 	checkFieldValidity: function(ref) {

 		console.log("Checking field validity for " + ref);

 		var fieldValidities = this.state.fieldValidities;
 			fieldValidities[ref] = this.refs[ref].isValid();

 			console.log(fieldValidities[ref]);

 		this.setState({ fieldValidities: fieldValidities });
 		this.checkContainerValidity();
 	},

 	/*
 	 * Check the validity of the container as a whole
 	 */
 	checkContainerValidity: function() {
 		var valid = true;
 		var invalidCount = 0;

 		for(var fieldKey in this.state.fieldValidities) {
 			if(this.state.fieldValidities[fieldKey] !== true) {
 				invalidCount++;
 				valid = false;
 			}
 		}

 		this.setState({ invalidCount: invalidCount, isValid: valid });
 	},

 	/*
 	 * Compile container data into one coherent object
 	 */
 	compileData: function() {
 		var data = {};
 		Object.keys(this.state.fields).map(function(key, i) {
 			data[key] = this.refs[key].state;
 		}.bind(this));

 		return data;
 	},

 	/*
 	 * Clear removed fields from state
 	 */
 	clearRemoved: function() {
 		this.setState({ fieldsRemoved: [] });
 	},

 	/*
 	 * Render the container
 	 */
	render: function() {
		var fields;

		// Check if any fields are stored in state.
		if(Object.keys(this.state.fields).length > 0) {
			fields = Object.keys(this.state.fields).map(function(key, index) {
				console.log(" => Creating field " + key + " (" + this.state.fields[key].name + ", " + this.state.fields[key].type + ")");
				console.log(this.state.fields[key]);
				return (
					React.createElement(FlowEditor.Field, React.__spread({}, 
						this.state.fields[key], 
						{stageType: this.props.stageType, 
						key: key, 
						"data-key": key, 
						ref: key, 
						index: index, 

						onChange: this.checkFieldValidity.bind(this, key), 
						onRemove: this.handleRemoveField.bind(this, key)}))
				);
			}.bind(this));
		} else {
			fields = (
				React.createElement("div", {className: "alert alert-info"}, 
					"No fields added — try ", React.createElement("a", {className: "alert-link", onClick: this.handleAddNewField}, "adding a new one"), "."
				)
			);
		}

		return (
			React.createElement("div", null, 
				React.createElement("h4", {className: "p-t"}, 
				    "Field configuration", 
				    React.createElement("div", {className: "btn-group btn-group-sm pull-right"}, 
				    	React.createElement("label", {htmlFor: "uploadConfig", className: "btn btn-primary-outline"}, 
				    		'Upload config'
				    	), 
				    	React.createElement("input", {type: "file", id: "uploadConfig", style: {display: "none"}, onChange: this.handleConfigUpload, accept: ".json"}), 
				    	React.createElement("a", {href: '/data/flow/download?stage=' + encodeURIComponent(this.props.stageName) + '&fields=' + window.btoa(JSON.stringify(this.state.fields)), target: "_blank", className: "btn btn-primary-outline"}, 
				    		'Download config'
				    	)
				    )
				), 
				React.createElement("hr", null), 
				React.createElement("div", {id: "flow-editor-fields-contain"}, 
					fields, 
		            React.createElement("button", {type: "button", className: "btn btn-primary btn-lg", onClick: this.handleAddNewField}, "Add a new field"), 
		            React.createElement("button", {type: "button", className: "btn btn-success btn-lg", onClick: this.props.handleSubmit, disabled: !this.state.isValid}, this.state.isValid ? "Submit changes" : this.state.invalidCount + " field(s) need attention before submitting")
				)
			)
		);
	}

});

FlowEditor.customizableFields 	= [ "select", "multiselect", "file" ];
FlowEditor.disableTypeChanges 	= [ "multiselect", "file" ];
FlowEditor.getDefaultFieldState = function(stageType) {
	switch(stageType) {
		case "pharmacy":
			return {
				name: "",
				type: "multiselect",
				mutable: true,
				settings: {
					options: {},
					allowCustomData: false
				},
			}
			break;
		default:
			return {
				name: "",
				type: "text",
				mutable: true,
				settings: {},
			};
			break;
	}
};
FlowEditor.getDefaultOptionState = function(stageType) {
	switch(stageType) {
		case "pharmacy":
			return {
				value: "",
				count: 0,
				available: false
			};
			break;
		default:
			return {
				value: ""
			};
			break;
	}
};

/**
 * Field JSON structure

 {
  "fields": {
    "[id]": {
      "name": "Patient name",
      "type": "text",
    },
    "[id]": { 
      "name": "Location",
      "type": "select",
      "settings": {
        "options": ["option 1", "option 2"],
        "allowCustomData": true
      }
    }
  }
}

*/

FlowEditor.Field = React.createClass({displayName: "Field",

	/*
	 * Initial state for a field
	 */
 	getInitialState: function() {
 		return FlowEditor.getDefaultFieldState(this.props.stageType);
 	},

 	/*
 	 * Set up field state based on props prior to mount
 	 */
 	componentWillMount: function() {
 		this.setState({ 
 			// Required properties
 			name: this.props.name,
 			type: this.props.type,
 			mutable: isTrue(this.props.mutable),

 			// Settings
 			description: this.props.hasOwnProperty("description") ? this.props.description : null,
 			settings: 
 				(FlowEditor.customizableFields).indexOf(this.props.type) !== -1 // If this field is a customizable field
 				&& typeof this.props.settings === "object" // If the settings object exists
 				&& Object.keys(this.props.settings).length > 0  // If the settings object has parameters
 					? this.props.settings // Use the settings object
 					: null, // Otherwise, return null

 		});
 	},

 	/*
 	 * Handle field name change
 	 */
 	handleFieldNameChange: function(event) {
 		this.setState({ name: event.target.value }, function() {
	 		// Remind container to check validity of inputs
	 		this.props.onChange(this.props['data-key']);
 		});

 	},

 	/*
 	 * Handle field type change
 	 */
 	handleFieldTypeChange: function(event) {
 		console.log("Type change from " + this.state.type + " => " + event.target.value);
 		this.setState({ type: event.target.value }, function() {
	 		// Remind container to check validity of inputs
	 		this.props.onChange(this.props['data-key']);
 		});
 	},

 	/*
 	 *
 	 */
 	handleFieldDescriptionChange: function(event) {
 		this.setState({ description: event.target.value }, function() {
	 		// Remind container to check validity of inputs
	 		this.props.onChange(this.props['data-key']);
 		});
 	},

 	/*
 	 * Handle field removal
 	 */
 	handleRemoveField: function() {
 		this.props.onRemove(this.props.key);
 	},

 	/*
 	 * Handle change to field settings.
 	 */
 	handleFieldSettingsChange: function() {

 		// Grab state object via React ref
 		var settings = this.refs['settings-' + this.props['data-key']].state;

 		// Bump child state up to parent settings state
 		this.setState({ settings: settings });
 	},

 	/*
 	 * Check the validity of this field.
 	 */
 	isValid: function() {
 		var valid = true;

 		// Field must have a name
 		if(this.state.name.length == 0) {
 			valid = false;
 		}

 		console.log(this.state.name + " has length " + this.state.name.length + " and therefore validity " + valid);

 		return valid;
 	},

 	/*
 	 * Display the field
 	 */
 	render: function() {

 		var nameInput,
 			description,
 			typeSelect,
 			disableTypeChangeNotification,
 			fieldContext,
 			fieldContextPlural;

 		// var fieldContext = this.props.stageType == "pharmacy" ? "category" : "input";


 		// Check if type change should be disabled for this input type
 		if(FlowEditor.disableTypeChanges.indexOf(this.state.type) !== -1) {
 			disableTypeChangeNotification = (
 				React.createElement("div", {className: "alert alert-info"}, 
 					"Once created, the ", React.createElement("strong", null, this.state.type), " field type cannot be changed to any other type."
 				)
 			);
 		}

 		// Handle stageType-based changes
 		if(this.props.stageType == "pharmacy") {
 			fieldContext = "Category";
 			fieldContextPlural = "categories";
 		} else {
 			fieldContext = "Input";
 			fieldContextPlural = "inputs";

	 		// Show option to change field type if NOT pharmacy stage
 			typeSelect = (
				React.createElement("div", {className: "form-group"}, 
					React.createElement("label", {className: "form-control-label"}, "Type:"), 
 					React.createElement("select", {className: "form-control", disabled: !this.state.mutable || FlowEditor.disableTypeChanges.indexOf(this.state.type) !== -1, onChange: this.handleFieldTypeChange, defaultValue: this.state.type}, 
 						React.createElement("optgroup", {label: "Inputs"}, 
	 						React.createElement("option", {value: "text"}, "Text input"), 
	 						React.createElement("option", {value: "textarea"}, "Textarea input"), 
	 						React.createElement("option", {value: "number"}, "Number input"), 
	 						React.createElement("option", {value: "date"}, "Date input")
	 					), 
	 					React.createElement("optgroup", {label: "Multiple-option fields"}, 
	 						React.createElement("option", {value: "select"}, "Select input with options"), 
	 						React.createElement("option", {value: "multiselect"}, "Multi-select input with options"), 
	 						React.createElement("option", {value: "file"}, "File input"), 
	 						React.createElement("option", {value: "yesno"}, "Yes or no buttons")
	 					), 
	 					React.createElement("optgroup", {label: "Other"}, 
	 						React.createElement("option", {value: "header"}, "Group fields with a header"), 
	 						React.createElement("option", {value: "pharmacy"}, "Pharmacy - show available medication")
	 					)
 					), 
 					disableTypeChangeNotification
 				)
	 		);
 		}

 		if(this.state.name.length == 0) {
 			nameInputGroup = (
 				React.createElement("div", {className: "form-group has-error"}, 
 					React.createElement("label", {className: "form-control-label", htmlFor: "name-" + this.props['data-key']}, "Name:"), 
 					React.createElement("input", {type: "text", 
 						id: "name-" + this.props['data-key'], 
 						className: "form-control form-control-error", 
 						placeholder: fieldContext + " name", 
 						maxLength: "100", 
 						onChange: this.handleFieldNameChange, 
 						defaultValue: this.state.name}), 
 					React.createElement("div", {className: "alert alert-danger"}, 
 						React.createElement("strong", null, "Heads up:"), " all ", fieldContextPlural, " require a name."
 					)
 				)
 			);
 		} else {
 			nameInputGroup = (
 				React.createElement("div", {className: "form-group"}, 
 					React.createElement("label", {className: "form-control-label", htmlFor: "name-" + this.props['data-key']}, "Name:"), 
 					React.createElement("input", {type: "text", 
 						id: "name-" + this.props['data-key'], 
 						className: "form-control", 
 						placeholder: "Field name", 
 						maxLength: "100", 
 						onChange: this.handleFieldNameChange, 
 						defaultValue: this.state.name})	
 				)	
 			);
 		}


 		//
 		if(this.state.description !== null
 			&& this.state.description.length > 0) {
 			description = this.props.description;
 		}

 		// {this.state.name.length > 0 ? '"' + this.state.name + '"' : 'this ' + fieldContext.toLowerCase()}
 		return (
 			React.createElement("div", {"data-key": this.props['data-key'], "data-index": this.props.index, className: "row flow-editor-configurator-row p-t"}, 

 				/* Configurator: field setup header */ 
 				React.createElement("div", {className: "col-xs-12"}, 
 					React.createElement("div", {className: "row"}, 
 						React.createElement("div", {className: "col-sm-12 col-md-10"}, 
	 						React.createElement("h4", {className: "field-title"}, 
		 						React.createElement("span", {className: "label label-info"}, "#", this.props.index + 1), 
		 						React.createElement("span", {className: "label label-default"}, this.props['data-key']), 
		 						React.createElement("span", {className: "title hidden-lg-down"}, 
		 							React.createElement("small", null, 
		 							this.state.name.length > 0 
		 								? this.state.name
		 								: (this.props.stageType == "pharmacy")
		 									? "Untitled category"
		 									: "Untitled " + this.state.type + " input"
		 							)
		 						)
		 					)
 						), 
	 					React.createElement("div", {className: "col-sm-12 col-md-2"}, 
		 					React.createElement("h4", {className: "field-title m-b"}, 
		 						React.createElement("button", {type: "button", className: "btn btn-sm btn-danger-outline pull-right", disabled: !this.state.mutable, onClick: this.handleRemoveField}, 
		 							"× Remove"
		 						)
		 					)
		 				)
 					)
 				), 
 				
 				/* Configurator: name/type */ 
 				React.createElement("div", {className: "col-sm-4 col-xs-12"}, 
 					nameInputGroup, 
 					typeSelect, 
	 				React.createElement("div", {className: "form-group"}, 
	 					React.createElement("label", {className: "form-control-label"}, "Description:"), 
	 					React.createElement("textarea", {
	 						className: "form-control", 
	 						maxLength: "255", 
	 						placeholder: "Enter a description here", 
	 						
	 						onChange: this.handleFieldDescriptionChange, 
	 						defaultValue: description}
	 					)
	 				)
 				), 

 				/* Configurator: settings */ 
	            React.createElement("div", {className: "col-sm-8 col-xs-12"}, 
	                React.createElement(FlowEditor.Field.Settings, {
	                	stageType: this.props.stageType, 
	                	ref: 'settings-' + this.props['data-key'], 
	                	"field-key": this.props['data-key'], 
	                	type: this.state.type, 
	                	mutable: this.state.mutable, 
	                	settings: this.state.settings, 

	                	onChange: this.handleFieldSettingsChange}
	                	)
	            )
	        )
 		);
 	}

 });


/*
 * Properties:
 *  - stageType: 
 *  - ref
 *  - field-key
 *  - type: type of the input for which we are showing options
 *  - mutable: is the field mutable
 *  - settings: previously defined settings stage
 *
 *  - onChange: define handler for when options change
 */
FlowEditor.Field.Settings = React.createClass({displayName: "Settings",

	/*
	 * Return initial state based on property type
	 */
	getInitialState: function() {
		console.log("Caught getInitialState for field settings dialog with type " + this.props.type);

		// Return initial state if settings are necessary for this file type
		switch(this.props.type) {

			// Select input
			case "select":
				console.log("\t| Dialog is for select field, returning initial select options.");
				return {
					options: {},
					allowCustomData: false,
				};
				break;

			// Multiselect input
			case "multiselect":
				console.log("\t| Dialog is for multiselect field, returning initial select options.");
				return {
					options: {},
				};
				break;

			// File input
			case "file":
				return {
					accept: []
				};
				break;

			// For all others...
			default:
				console.log("\t| Field not recognized, skipping.");
				return {};
				break;
		}
	},

	/*
	 * Prepare component for mounting
	 */
	componentWillMount: function() {
 		
 		console.log("");
 		console.log("--[mount: " + this.props['field-key'] + "]--")
		console.log("Mounting options dialog for '" + this.props.type + "' input with props:");
		console.log(this.props);

		// If we have a field type that requires settings, load default settings into state
		switch(this.props.type) {

			// Select field type
			case "select":

				// If there's already an options array...
				if(this.props.hasOwnProperty('settings') && this.props.settings !== null) {

					// Settings array exists. Check for each setting data point
					if(this.props.settings.hasOwnProperty("options")) {
						this.setState({ options: this.props.settings.options });
					}

					// If there's a set value for allowing custom data...
					if(this.props.settings.hasOwnProperty("allowCustomData") && this.props.settings.allowCustomData == "true") {
						this.setState({ allowCustomData: (this.props.settings.allowCustomData == "true") });
					}

				} else {
					console.log("\t| Input DOES NOT have pre-defined settings");
				}

				break;

			// Multiselect field type
			case "multiselect":

				// If there's already an options array...
				if(this.props.hasOwnProperty('settings') && this.props.settings !== null) {

					// Settings array exists. Check for each setting data point
					if(this.props.settings.hasOwnProperty("options")) {
						this.setState({ options: this.props.settings.options });
					}

				} else {
					console.log("\t| Input DOES NOT have pre-defined settings");
				}

				break;

			// File field type
			case "file":

				// If there's already an options array...
				if(this.props.hasOwnProperty('settings') && this.props.settings !== null) {

					// Settings array exists. Check for each setting data point
					if(this.props.settings.hasOwnProperty("accept")) {
						this.setState({ accept: this.props.settings.accept });
					}

				} else {
					console.log("\t| Input DOES NOT have pre-defined settings");
				}

				break;
		}
	},

	/*
	 * Component completed mounting (debug)
	 */
	componentDidMount: function() {
		console.log("Component 'FlowEditorFieldConfiguratorSettingsDialog' mounted, state is now:");
		console.log(this.state);
 		console.log("--[/mount: " + this.props['field-key'] + "]--");
 		console.log("");
	},

	/*
	 * Handle adding of a new option (SELECT/MULTISELECT type)
	 */
	handleAddOption: function() {

		console.log("");
		console.log("--[add option: " + this.props['field-key'] + "]--");

		var push = function() {

			// Grab options object, add a new entry with default option state based on stage type
			var options = this.state.options;
				options[new Date().getTime()] = FlowEditor.getDefaultOptionState(this.props.stageType);

			// Push to our local state
			this.setState({ options: options });

			// Bump changes to parent element for aggregation
			this.props.onChange(this.state);

			console.log("--[/add option: " + this.props['field-key'] + "]--");
			console.log("");

		}.bind(this);

		if(!this.state.hasOwnProperty('options')) {
			// No options yet (type was probably just changed to select), add one.
			// Make sure to set other initial state values first
			console.log("\t| Missing options property, returning component to initial state and continuing...");
			this.setState(this.getInitialState(), function() {
				push();
			}.bind(this));
		} else {
			console.log("\t| Options array exists, pushing...");
			push();
		}

	},

	/*
	 * Handle removing of an option (SELECT/MULTISELECT type)
	 */
	handleRemoveOption: function(optionKey) {
		// Cache options object
		var options = this.state.options;

		// Get rid of it!
		if(options.hasOwnProperty(optionKey)) {
			delete options[optionKey];
		}

		this.setState({ options: options }, function() {
	
			// Bump changes to parent element for aggregation
			this.props.onChange(this.state);

		}.bind(this));
	},

	/*
	 * Handle change option position (SELECT/MULTISELECT type)
	 */
	handleChangeOptionPosition: function(where, optionKey) {
		return function(event) {

			console.log("Looking to move '" + optionKey + "' " + where);

			var options = this.state.options;
			var keys = Object.keys(options);
			var value = options[optionKey]; 		// Get option data object at optionKey
			var index = keys.indexOf(optionKey);	// Get index of optionKey

			// If the index was found
			if(index !== -1) {

				console.log(" -> found @ index " + index);

				var cacheKey;
				var indexKey = keys[index];

				switch(where) {
					case "up":
						cacheKey = keys[index - 1]; // get option KEY corresponding to the index above
						break;
					case "down":
						cacheKey = keys[index + 1]; // get option KEY corresponding to the index below
						break;
				}	

				// Get option value object by index
				var cacheValue = options[cacheKey];
					options[cacheKey] = value;
					options[indexKey] = cacheValue;

				console.log(" -> caching key: " + cacheKey);
				console.log(" -> value @ cached key: " + cacheValue);
				console.log(" -> New options:");
				console.log(options);

				this.setState({
					options: options
				}, function() {
					// Bump state up to parent for aggregation
					this.props.onChange(this.state);
				}.bind(this));

			} else {
				console.log("WARNING: " + where + " not found in options");
			}
		}.bind(this);
	},

	/*
	 * Handle change of option text (SELECT/MULTISELECT type)
	 */
	handleChangeOptionText: function(optionKey) {
		return function(event) {
			var options = this.state.options;

			// If the option at this index exists
			if(options.hasOwnProperty(optionKey)) {
				options[optionKey].value = event.target.value;
			}

			this.setState({ options: options }, function() {
				// Bump changes to parent element for aggregation
				this.props.onChange(this.state);
			}.bind(this));

			
		}.bind(this);
	},

	/*
	 * Handle change of allow custom data checkbox (SELECT/MULTISELECT type)
	 */
	handleAllowCustomDataChange: function() {
		console.log("");
		console.log("--[handleAllowCustomDataChange]--");
		console.log("\t| for: " + this.props['field-key']);
		console.log("\t| State before custom data change:");
		console.log(this.state);

		var newStatus = !this.state.allowCustomData;
		this.setState({ allowCustomData: newStatus }, function() {
			console.log("\t| New state:");
			console.log(this.state);

			// Bump changes to parent element for aggregation
			this.props.onChange(this.state);

			console.log("--[/handleAllowCustomDataChange]--");
			console.log("");
		});

	},

	/**
	 * Change the allowed filetypes (FILE field type)
	 */
	handleChangeAllowedFiletypes: function(event) {

		var options = event.target.options;
		var values = [];

		for(var i = 0; i < options.length; i++) {
			if(options[i].selected) {
				values.push(options[i].value);
			}
		}

		console.log("Allowed filetypes is now:");
		console.log(values);
		console.log(this.state);

		this.setState({ accept: values }, function() {
			this.props.onChange(this.state);
		}.bind(this));
	},

	/*
	 *
	 */
	handleDrugQuantityChange: function(optionKey) {
		return function(event) {
			var options = this.state.options;
				options[optionKey].count = parseInt(event.target.value);

			this.setState({
				options: options
			}, function() {
				this.props.onChange(this.state);
			}.bind(this));
		}.bind(this);
	},

	/*
	 *
	 */
	handleDrugAvailabilityChange: function(optionKey) {
		return function(event) {
			var options = this.state.options;
				options[optionKey].available = (event.target.value == "true");

			this.setState({
				options: options
			}, function() {
				this.props.onChange(this.state);
			}.bind(this));

		}.bind(this);
	},

	/*
	 * Render the settings dialog
	 */
	render: function() {

		console.log("Rendering settings dialog for type " + this.props.type);

		var mutabilityMessage;

		// Add a message if this field is immutable
		if(this.props.mutable == false) {
			mutabilityMessage = (
				React.createElement("div", {className: "alert alert-danger"}, 
					React.createElement("strong", null, "Notice:"), " This field is protected. Only the display name and type-based settings can be modified."
				)
			);
		} else {
			mutabilityMessage = (
				React.createElement("span", null)
			);
		}

		switch(this.props.type) {
			case "text":
			case "textarea":
			case "number":
			case "date":
			case "yesno":
			case "header":
			case "pharmacy":
				return (
					React.createElement("div", null, 
						React.createElement("div", {className: "alert alert-info m-t"}, 
							"No configuration is required for ", this.props.type, " inputs."
						), 
						mutabilityMessage
					)
				);
				break;

			case "select":
			case "multiselect":

				console.log(" -> Options:");
				console.log(this.state.options);

				var optionInputs,
					customDataCheckbox;

				var noOptionsDefined = function() {

					// No options available, show info message
					optionInputs = (
						React.createElement("div", {className: "alert alert-info"}, 
							"No options have been defined — try ", React.createElement("a", {className: "alert-link", onClick: this.handleAddOption}, "adding one"), "." 
						)
					);

				};

				if(this.state.hasOwnProperty('allowCustomData') && this.state.allowCustomData == true) {
					customDataCheckbox = (
						React.createElement("div", {className: "col-sm-12"}, 
							React.createElement("div", {className: "checkbox m-t"}, 
								React.createElement("label", null, 
									React.createElement("input", {type: "checkbox", 
										checked: this.state.allowCustomData == true, 
										onChange: this.handleAllowCustomDataChange}), 
										"Allow users to enter custom data for this field"
								)
							)
						)
					);
				}

				// If there are options in the state
				if(this.state.hasOwnProperty('options')) {
					var optionKeys = Object.keys(this.state.options);

					if(optionKeys.length > 0) {

						// Map option input containers to one variable
						optionInputs = optionKeys.map(function(optionKey, index) {
							// console.log(" : " + index + "=" + value);

							var thisOption = this.state.options[optionKey];
							var upButton, 
								downButton,
								drugOptions;

							if(index !== 0) {
								upButton = (
									React.createElement("button", {type: "button", className: "btn btn-primary", onClick: this.handleChangeOptionPosition("up", optionKey)}, 
										"↑"
									)
								);
							}

							if(index !== (optionKeys.length - 1)) {
								downButton = (
									React.createElement("button", {type: "button", className: "btn btn-primary", onClick: this.handleChangeOptionPosition("down", optionKey)}, 
										"↓"
									)
								);
							}

							if(this.props.stageType == "pharmacy") {

								drugOptions = (
									React.createElement("div", {className: "col-xs-12"}, 
										React.createElement("div", {className: "row"}, 
											React.createElement("div", {className: "col-xs-12 col-sm-6"}, 
												React.createElement("div", {className: "input-group input-group-sm"}, 
													React.createElement("input", {
														type: "number", 
														className: "form-control", 
														min: 0, 
														value: thisOption.count, 
														onChange: this.handleDrugQuantityChange(optionKey)}), 
													React.createElement("span", {className: "input-group-addon"}, 
														"qty in stock"
													)
												)
											), 
											React.createElement("div", {className: "col-xs-12 col-sm-6"}, 
												React.createElement("div", {className: "input-group input-group-sm"}, 
													React.createElement("span", {className: "input-group-addon"}, 
														"available"
													), 
													React.createElement("select", {
														className: "form-control", 
														defaultValue: thisOption.available, 
														onChange: this.handleDrugAvailabilityChange(optionKey)}, 
														React.createElement("option", {value: true}, "Yes"), 
														React.createElement("option", {value: false}, "No")
													)
												)
											)
										)
									)
								);

							}


							return (
								React.createElement("div", {className: (this.props.stageType !== "pharmacy" ? "field-select-option " : "") + "form-group row", key: index}, 
									React.createElement("div", {className: "col-sm-12"}, 
										React.createElement("div", {className: "input-group input-group-sm"}, 
											React.createElement("input", {type: "text", 
												placeholder: "Enter a value for this option", 
												className: "form-control", 
												value: thisOption.value, 
												onChange: this.handleChangeOptionText(optionKey)}), 
											React.createElement("span", {className: "input-group-btn"}, 
												upButton, 
												downButton, 
												React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.handleRemoveOption.bind(this, optionKey)}, 
												  	React.createElement("span", null, "×")
												)
											)
										)
									), 
									drugOptions
								)
							);
						}.bind(this));

					} else {
						noOptionsDefined();
					}
				} else {
					noOptionsDefined();
				}

				return (
					React.createElement("div", {className: "field-select-options-contain p-t"}, 
		            	React.createElement("h5", null, this.props.stageType == "pharmacy" ? "Drugs in this category" : "Options", " (",  this.state.hasOwnProperty('options') ? Object.keys(this.state.options).length : 0, ")"), 
						optionInputs, 
						customDataCheckbox, 
						mutabilityMessage, 
						React.createElement("button", {type: "button", className: "btn btn-primary-outline", onClick: this.handleAddOption}, 
							"Add another ", this.props.stageType == "pharmacy" ? "drug" : "option"
						)
					)
				);

				break;

			case "file":
				return (
					React.createElement("div", {className: "field-select-options-contain"}, 
						React.createElement("h5", null, "Accepted file types"), 
						React.createElement("select", {className: "form-control", multiple: true, onChange: this.handleChangeAllowedFiletypes, defaultValue: this.state.accept}, 
							React.createElement("option", {value: "image/*"}, "image / *")
						), 
						mutabilityMessage
					)
				);
				break;

			default:
				return (
					React.createElement("div", null, 
						React.createElement("div", {className: "alert alert-danger m-t"}, 
							"Unrecognized input type \"", this.props.type, "\""
						), 
						mutabilityMessage
					)
				);
				break;
		}
	}
});