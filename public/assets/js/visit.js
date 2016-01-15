/**
 * visit.jsx
 */

/*
 * Visit container
 *
 * The visit container acts as a state bridge between the
 * PatientsOverview and PatientsContainer module.
 *
 * Accepted properties:
 *  - _token: Laravel CSRF token
 *  - containerTitle: Title for the PatientContainer block
 *  - controlsType: Denote which set of controls should appear ["new-visit", "stage-visit"]
 *  - redirectOnFinish: URL to redirect to on complete
 *
 *  - visitID: ID of the current visit being modified (null if new visit setup)
 *  - patients: Patients object with fieldID => data setup
 *  - stages: Array of stages (in order of 'order') for finish modal
 *  - currentStage: ID of current stage
 *  - currentStageType: type of current stage (basic, pharmacy)
 *
 *  - mutableFields: NEW Fields which should be mutable for EACH patient in the PatientContainer block.
 *  - patientFields: PREEXISTING Fields which should have their data displayed in the PatientOverview block.
 *  - summaryFields: PREEXISTING Fields which should have their data displayed in the PatientOverview block.
 */
var Visit = React.createClass({displayName: "Visit",

	/*
	 * Get initial Visit state
	 */
	getInitialState: function() {
		return {
			isSubmitting: false,
			progress: 0,
			confirmFinishVisitResponse: null,

			patients: {},
			resources: {},
			prescriptions: {},
		};
	},

	/*
	 * Deploy necessary state changes prior to mount
	 */
	componentWillMount: function() {

		var props = this.props;

		console.log("[Visit] Mounting...");
		console.log(props);

		if(props.hasOwnProperty("patients") && props.patients !== null) {
			console.log("[Visit] Pre-existing patients detected, loading into state.");

			var patients = {};
			for(var patientID in props.patients) {
				console.log("[Visit] ...setting up patient " + patientID);
				patients[patientID] = Utilities.applyGeneratedFields(props.patients[patientID]);
			}

			console.log("[Visit] Done setting up patients:");
			console.log(patients);
			console.log(" ");

			this.setState({
				patients: patients
			}, function() {
				console.log("[Visit] Done mounting " + Object.keys(this.state.patients).length + " patients.");
				__debug(this.state.patients);
			}.bind(this));
		}
	},

	/*
	 *
	 */
	handleConfirmFinishVisit: function( destination, modalObject ) {

		var props = this.props;

		// Update state to submitting
		this.setState({
			isSubmitting: true,
		});

		// Go ahead and close the modal
		$("#visit-finish-modal")
			.modal('hide')
			.on('hidden.bs.modal', function(e) {
				console.log("Modal hidden");
				modalObject.setState(modalObject.getInitialState());
				modalObject.resetSelectState();
			});

		$.ajax({
			type: "POST",
			url: "/visits/store",
			data: {
				"_token": props._token,
				visit: props.visitID,
				patients: this.state.patients,
				stage: props.currentStage,
				destination: destination
			},
			xhr: function() {
				var xhr = new window.XMLHttpRequest();

				xhr.upload.addEventListener("progress", function(evt) {
		            if (evt.lengthComputable) {
		                var percentComplete = evt.loaded / evt.total;

		                //Do something with upload progress here
		                this.setState({
		                	progress: percentComplete * 100
		                });
		            }
		       }.bind(this), false);

				return xhr;
			}.bind(this),
			success: function(resp) {
				this.setState(this.getInitialState());
			}.bind(this),
			error: function(resp) {

			},
			complete: function(resp) {
				this.setState({
					confirmFinishVisitResponse: resp.responseJSON
				});
			}.bind(this)
		});
	},

	/*
	 * Handle addition of a new patient.
	 *
	 * @arguments
	 * - patient: Object of patient data as pulled from the patients database table
	 */
	handlePatientAdd: function( patient ) {
		var patients = this.state.patients;

		if(patients.hasOwnProperty(patient.id)) {
			// Patient already in Visit
		} else {
			// Update state with new patient
			patients[patient.id] = Utilities.applyGeneratedFields(patient);
			this.setState({
				confirmFinishVisitResponse: null,
				patients: patients
			});
		}
	},

	/*
	 * Aggregate data
	 */
	handleFinishVisit: function( isDoneLoading ) {
		$("#visit-finish-modal")
			.modal('show');
	},


	/*
	 *
	 */
	topLevelPatientStateChange: function(patientID, fieldID, value) {
		console.log("[Visit]->topLevelPatientStateChange(): patientID=" + patientID + ", fieldID=" + fieldID + ", value=" + value);

		// Check if patient is in our patients array
		if(this.state.patients.hasOwnProperty(patientID)) {

			var patients = this.state.patients; // Grab patients from state
				patient = patients[patientID], // Grab patient object
				patient[fieldID] = value; // Find our patient and set fieldID = passed value

			// Apply generated fields to patient object
			patient = Utilities.applyGeneratedFields(patient);

			// __debug(patients);

			// Push patients back to state
			this.setState({
				patients: patients
			});

		} else {
			console.error("[Visit]->topLevelPatientStateChange(): Missing patient ID " + patientID + " in Visit patients state");
		}
	},

	/*
	 *
	 */
	topLevelStoreResource: function(resourceID, resource) {
		console.log("[Visit]->topLevelStoreResource(): resourceID=" + resourceID + ", resource=" + resource);

		var resources = this.state.resources;
			resources[resourceID] = resource;

		this.setState({
			resources: resources
		});
	},

	/*
	 *
	 */
	/*topLevelAddPrescription: function(patientID, drugs) {
		console.log("[Visit]->topLevelAddPrescription()");

		// Make sure drugs is a valid type
		if(Array.isArray(drugs) && drugs.length > 0) {
			var prescriptions = this.state.prescriptions;

			var patientPrescriptions;

			// If this is the first time we're seeing prescriptions for
			// this patient, create a new prescriptions Array...
			// otherwise, grab the old one.
			if(prescriptions.hasOwnProperty(patientID)) {
				patientPrescriptions = prescriptions[patientID];
			} else {
				patientPrescriptions = [];
			}

			// Loop through drugs found for this patient
			for(var i = 0; i < drugs.length; i++) {
				var thisDrug = drugs[i];
				// Make sure the drug isn't already in the list
				if(patientPrescriptions.indexOf(thisDrug) === -1) {
					patientPrescriptions.push(thisDrug);
				}

			}

			// Update patient record in prescriptions
			prescriptions[patientID] = patientPrescriptions;

		}

		this.setState({
			prescriptions: prescriptions
		});
	},*/

	/*
	 * Render Visit container
	 */
	render: function() {
		console.log("[Visit]->render(): Rendering visit container...resources are:");
		console.log(this.state.resources);
		console.log(" ");

		var props = this.props,
			state = this.state;

		return (
			React.createElement("div", {className: "row"}, 
				React.createElement(Visit.FinishModal, {
					stages: props.stages, 
					onConfirmFinishVisit: this.handleConfirmFinishVisit}), 

				React.createElement(Visit.PatientsOverview, {
					fields: props.patientFields, 
					patients: state.patients, 
					mini: false, 
					resources: state.resources}), 

				React.createElement(Visit.PatientsContainer, {
					_token: props._token, 
					controlsType: props.controlsType, 
					containerTitle: props.containerTitle, 
					stageType: props.currentStageType, 

					summaryFields: props.summaryFields, 
					fields: props.mutableFields, 
					patients: state.patients, 
					prescriptions: state.prescriptions, 

					isSubmitting: state.isSubmitting, 
					progress: state.progress, 
					confirmFinishVisitResponse: state.confirmFinishVisitResponse, 

					onFinishVisit: this.handleFinishVisit, 
					onPatientAdd: this.handlePatientAdd, 
					onPatientDataChange: this.topLevelPatientStateChange, 
					onStoreResource: this.topLevelStoreResource})
			)
		);

							//onFindPrescription={this.topLevelAddPrescription}
	}

});

/*
 * Variables
 */
Visit.generatedFields = {
	"generatedHeader": {
		name: "Generated",
		type: "header"
	},
	"age": {
		name: "Age",
		type: "number"
	}
};


/*
 * Patients overview (left sidebar)
 *
 * Accepted properties:
 * - fields: Object of ALL fields for ALL stages up to THIS CURRENT STAGE for displaying patient metadata
 * - patients: Object of patients w/ data as pulled from database
 *
 * - mini: should this display as a card instead of a column
 */
Visit.PatientsOverview = React.createClass({displayName: "PatientsOverview",

	/*
	 * Render patient overview blocks
	 */
	render: function() {

		var props = this.props,
			patientKeys = Object.keys(props.patients),
			countPatients = patientKeys.length,
			patientOverviews,
			iterableFields;

		console.log("[Visit.PatientsOverview]->render(): " + countPatients + " (mini=" + props.mini + ")");
		console.log(props);

		// Copy the local patient fields property to a new variable
		// and remove first/last name, so they don't appear in the list
		if(props.mini == true) {
			iterableFields = jQuery.extend({}, props.fields);
		} else {
			iterableFields = jQuery.extend(jQuery.extend({}, props.fields), Visit.generatedFields);
		}

		// Remove fields that are displayed differently than normal
		delete iterableFields["first_name"];
		delete iterableFields["last_name"];
		delete iterableFields["photo"];

		// If there are patients in the props object
		if(countPatients > 0) {
			patientOverviews = patientKeys.map(function(patientID, index) {
				var cardHeader,
					photo,
					thisPatient = props.patients[patientID];

				if(thisPatient.hasOwnProperty('photo') && thisPatient.photo !== null) {

					console.log("[Visit.PatientOverview][" + patientID + "]: has photo");

					var resourceKeys,
						resources = props.hasOwnProperty("resources") ? props.resources : {};

					try {
						if(typeof thisPatient.photo === "string") {
							console.log("[Visit.PatientOverview][" + patientID + "]: photo is STRING");
							// Parse JSON from database as string
							resourceKeys = JSON.parse(thisPatient.photo);
						} else {
							console.log("[Visit.PatientOverview][" + patientID + "]: photo is NOT STRING");
							// Otherwise, just push the object
							resourceKeys = thisPatient.photo;
						}
					} catch(e) {
						console.log("[Visit.PatientOverview][" + patientID + "]: error parsing photo string");
						resourceKeys = [];
					}

					if(resourceKeys.length > 0) {

						var photoKey = resourceKeys[0];

						console.log("[Visit.PatientOverview][" + patientID + "]: Valid resources array obtained, looking for photo...");

						// Check if we have this resource in storage already.
						if(resources.hasOwnProperty(photoKey)) {

							console.log("[Visit.PatientOverview][" + patientID + "]: Photo found in our pre-loaded resources.");

							// For the immutable Photo input, the one and only file is the patient photo.
							var photoData = resources[photoKey];

							console.log("[Visit.PatientOverview]->render(patientID=" + patientID + "): has photo");

							photo = (
								React.createElement(Fields.Resource, {
									id: photoKey, 
									resource: { type: "image/jpeg", base64: photoData.data}})
							);

						} else {
							console.log("[Visit.PatientOverview][" + patientID + "]: photo not in resources, preparing to grab via AJAX");

							photo = (
								React.createElement(Fields.Resource, {
									id: resourceKeys[0], 
									resource: { type: "image/jpeg"}})
							);
						}
					}

				}

				// Show header if we're not in Mini mode
				if(props.mini == false) {
					cardHeader = (
						React.createElement("span", null, 
			               	React.createElement("div", {className: "card-header"}, 
			                    React.createElement("span", {className: "label label-info"}, "#", index + 1), 
			                    React.createElement("span", {className: "label label-default"}, patientID)
			                ), 
			                React.createElement("div", {className: "card-block"}, 
			                	React.createElement("h4", {className: "card-title text-xs-center m-a-0"}, 
			                		React.createElement("strong", null, 
										Utilities.getFullName(thisPatient)
									)
			                	)
			                ), 
			                photo
			            )
			        );
				}

				console.log("[Visit.PatientsOverview] Rendering patient overview card - ID #" + patientID);

				return (
					React.createElement("div", {className: "card forcept-patient-summary", key: patientID}, 
						cardHeader, 
		              	React.createElement("div", {className: "list-group list-group-flush"}, 
		                    Object.keys(iterableFields).map(function(field, index) {

		                    	var thisIterableField = iterableFields[field],
									foundData = false,
									isGeneratedField = Visit.generatedFields.hasOwnProperty(field),
									value = "No data",
									icon;

		                    	if(
		                    		thisPatient.hasOwnProperty(field) 	// If this field exists in the patient data
		                    		&& thisPatient[field] !== null	 	// If the data for this field is null, show "No data"
		                    		&& thisPatient[field].length > 0	// If string length == 0 or array length == 0, show "No data"
		                    	) {

									var thisPatientField = thisPatient[field];

		                    		if(!(props.mini == true && isGeneratedField)) // Don't show generated fields in Mini mode
		                    		{
			                    		if( ["string", "number"].indexOf(typeof thisPatientField) !== -1 ) // If the field is a string or number
			                    		{

			                    			// We found data!
			                    			foundData = true;

											// Grab field types
											var fieldType = thisIterableField.type;

			                    			console.log(" | Field " + thisIterableField.name + " is string or number");
			                    			console.log(" | -> type: " + fieldType);

			                    			// We might need to mutate the data
			                    			switch(fieldType) {

			                    				/**
			                    				 * Things with multiple lines
			                    				 */
			                    				case "textarea":
			                    					value = (
			                    						React.createElement("p", {dangerouslySetInnerHTML: { __html: thisPatientField.replace(/\n/g, "<br/>")}})
			                    					);
			                    					break;

			                    				/**
			                    				 * Things stored as arrays
			                    				 */
			                    				case "multiselect":
			                    				case "pharmacy":
			                    					// Convert from JSON array to nice string
													var arr;
			                    					try {
														arr = JSON.parse(thisPatientField);
													} catch(e) {
														arr = [];
													}

													// Make sure it worked
			                    					if(Array.isArray(arr) && arr.length > 0) {
														// console.log("[Visit.PatientsOverview] Found " + arr.length + " prescriptions for patient #" + patientID);
														// console.log(props.hasOwnProperty("onFindPrescription"));
														// if(fieldType === "pharmacy" && props.hasOwnProperty("onFindPrescription")) {
															// props.onFindPrescription(patientID, arr);
														// }
			                    						value = arr.join(", ");
			                    					}

			                    					console.log(" | Multiselect value: " + value);

			                    					break;

			                    				/**
			                    				 * Things stored as base64
			                    				 */
			                    				case "file":
			                    					/*var split = thisPatient[field].toString().split(";");
			                    					var dataSection = split[0]; // data:image/png

			                    					if(dataSection.split("/")[0] == "data:image") {
				                    					value = (
				                    						<div className="patient-photo-contain">
				                    							<img src={thisField.toString()} />
				                    						</div>
				                    					);
			                    					} else {
			                    						value = "1 file, " + getFileSize(thisPatient[field]);
			                    					}*/

			                    					break;

			                    				/**
			                    				 * Everything else
			                    				 */
			                    				default:
			                    					value = thisPatientField.toString();
			                    					break;
			                    			}
			                    		} else {
			                    			console.log(" | Field " + thisIterableField["name"] + " is NOT string or number");
			                    			console.log(" | -> type: " + thisIterableField.type);
			                    			if( Array.isArray(thisPatientField) ) // If the data is an array
			                    			{
			                    				// We found data!
			                    				foundData = true;
			                    				value = (
			                    					React.createElement("span", {className: "pull-right"}, 
			                    						thisPatientField.join(", ")
			                    					)
			                    				);
			                    			} else {
			                    				// WTF is it?
			                    				console.log("WARNING: unknown field data type for field " + field);
			                    			}
			                    		}
			                    	}
		                    	}

		                    	// Choose which icon to display
		                    	if(!isGeneratedField) {
		                    		if(foundData) {
		                    			icon = (
		                    				React.createElement("span", {className: "text-success"}, 
		                    					"\u2713"
		                    				)
		                    			);
		                    		} else {
		                    			icon = (
		                    				React.createElement("span", {className: "text-danger"}, 
		                    					"\u2717"
		                    				)
		                    			);
		                    		}
		                    	} else {
		                    		icon = "\u27a0";
		                    	}

		                    	// Render the list item
		                    	if(thisIterableField.type == "header") {
		                    		if(props.mini == false) {
			                    		return (
			                    			React.createElement("div", {className: "list-group-item forcept-patient-overview-header-item", key: field + "-" + index}, 
			                    				React.createElement("h5", {className: "text-center m-a-0"}, 
			                    					thisIterableField.name
			                    				)
			                    			)
			                    		);
			                    	}
		                    	} else {
									return (
										React.createElement("div", {className: "list-group-item", key: field + "-" + index}, 
											React.createElement("dl", null, 
												React.createElement("dt", null, icon, "   ", thisIterableField.name), 
												React.createElement("dd", null, foundData ? value : "")
											)
										)
									);
		                    	}
	                    	}.bind(this))
		                )
					)
				);
			}.bind(this));
		} else {
			patientOverviews = (
				React.createElement("div", {className: "alert alert-info hidden-sm-down"}, 
					"No patients within this visit."
				)
			);
		}

		// If we're in mini mode, use different column structure
		if(props.mini == true) {
			return (
		        React.createElement("div", {className: "col-xs-12 col-lg-6"}, 
		           patientOverviews
		        )
			);
		} else return (
	        React.createElement("div", {className: "col-xs-12 col-sm-12 col-md-4 col-xl-3"}, 
	           patientOverviews
	        )
	    );
	}

});


/*
 * Patients management (main content)
 *
 * Properties:
 *  - _token: 			Laravel CSRF token
 *  - controlsType: 	determine which controls set to use
 *  - containerTitle: 	Title for patients container
 *
 *  - fields: 			All fields for this stage
 *  - patients:  		All patients in this visit
 *
 * 	- isSubmitting:  	is the parent form in submission state?
 *
 *  - onFinishVisit:  	Bubble onFinishVisit event up to Visit container
 *  - onPatientAdd: 	Bubble onPatientAdd event up to Visit container
 *  - onPatientDataChange: Bubble onPatientDataChange event up to Visit container
 *  - onStoreResource: Bubble onStoreResource event up to Visit container
 */
Visit.PatientsContainer = React.createClass({displayName: "PatientsContainer",

	/*
	 * Initially, the container isn't loading
	 */
	getInitialState: function() {
		return {
			showImportBlock: false,
			isLoading: false
		}
	},

	/*
	 * Set state to loading
	 */
	isLoading: function(val) {
		this.setState({
			isLoading: val
		});
	},

	/*
	 * Handle finishing the visit
	 */
	onFinishVisit: function() {
		console.log("PatientsContainer: onFinishVisit");
		this.isLoading(true);
		this.props.onFinishVisit(this.isLoading(false));
	},

	/*
	 * Add a bare patient record
	 */
	handlePatientAddfromScratch: function() {

		// Set state as loading
		this.isLoading(true);

		$.ajax({
			type: "POST",
			url: "/patients/create",
			data: {
				"_token": this.props._token
			},
			success: function(resp) {
				console.log("success");
				if(resp.status == "success") {
					this.props.onPatientAdd(resp.patient);
				}
			}.bind(this),
			error: function(resp) {
				console.log("handlePatientAddfromScratch: error");
				console.log(resp);
				// console.log(resp);
			},
			complete: function() {
				this.isLoading(false);
			}.bind(this)
		});

	},

	handleShowImportBlock: function() {
		this.setState({
			showImportBlock: true
		});
	},
	handleCloseImportBlock: function() {
		this.setState({
			showImportBlock: false
		});
	},

	render: function() {

		console.log("[Visit.PatientsContainer]->render(): Rendering patients container.");
		var props = this.props,
			state = this.state,
			isLoading = (state.isLoading || props.isSubmitting),
			patients = (props.hasOwnProperty('patients') ? props.patients : {}),
			patientIDs = Object.keys(patients),
			patientsCount = patientIDs.length,
			patientsDOM,
			importBlock,
			controls;

		console.log("[Visit.PatientsContainer]->render(): patientIDs=" + patientIDs + ", patientsCount=" + patientsCount);

		// Loading state can be triggered by:
		// 		isLoading 		-> provided by controls, procs when adding new patient / importing
		// 		isSubmitting 	-> provided by container, procs when visit is submitted to next stage

		// If we're submitting, don't show patients block
		if(!props.isSubmitting) {

			// Set up patients block
			if(patientsCount > 0) {

				// Build patients DOM
				patientsDOM = patientIDs.map(function(patientID, index) {

					var thisPatient = patients[patientID];

					console.log("[Visits.PatientsContainer]->render(): ...#" + patientID);
					console.log("[Visits.PatientsContainer]->render(): ...fields=" + props.fields);
					console.log("[Visits.PatientsContainer]->render(): ...patient=" + patients[patientID]);

					return (
						React.createElement("div", {key: patientID}, 
							React.createElement(Visit.Patient, {
								/*
								 * Patient record
								 */
								patient: thisPatient, 
								id: patientID, 
								index: index, 

								/*
								 * All available fields
								 */
								fields: props.fields, 

								/*
								 * Fields to summarize at the top of each patient
								 */
								summaryFields: props.summaryFields, 

								/*
								 * Event handlers
								 */
								onPatientDataChange: props.onPatientDataChange, 
								onStoreResource: props.onStoreResource}), 
							React.createElement("hr", null)
						)
					);
				}.bind(this));
			} else {
				patientsDOM = (
					React.createElement("div", {className: "alert alert-info"}, 
						"There are currently no patients in this visit."
					)
				);
			}
		} else {
			// Scroll to top of window
			window.scrollTo(0, 0);
		}

		// Set up import block
		if(state.showImportBlock) {
			importBlock = (
				React.createElement(Visit.ImportBlock, {
					_token: props._token, 

					onPatientAdd: props.onPatientAdd, 
					onClose: this.handleCloseImportBlock})
			);
		}

		// Set up controls block
		switch(props.controlsType) {
			case "new-visit":
				// We're on the new visit page
				controls = (
					React.createElement(Visit.NewVisitControls, {
						isLoading: isLoading, 
						isImportBlockVisible: state.showImportBlock, 

						onFinishVisit: this.onFinishVisit, 
						onPatientAddFromScratch: this.handlePatientAddfromScratch, 
						onShowImportBlock: this.handleShowImportBlock})
				);
				break;
			case "stage-visit":
				// We're on some sort of stage page
				controls = (
					React.createElement(Visit.StageVisitControls, {
						isLoading: isLoading, 

						onFinishVisit: this.onFinishVisit})
				);
				break;
		}

		// Add messages as necessary
		var message;
		if(isLoading == true) {

			// If we have a progress value
			if(props.progress > 0) {
				var percent = props.progress.toFixed(1);
				message = (
					React.createElement("div", null, 
						React.createElement("div", {className: "alert alert-info"}, 
							React.createElement("strong", null, "One moment...")
						), 
						React.createElement("progress", {className: "progress progress-striped progress-animated", value: percent, max: "100"}, 
							percent, "%"
						)
					)
				);
			} else {
				message = (
					React.createElement("div", {className: "alert alert-info"}, 
						React.createElement("strong", null, "One moment...")
					)
				);
			}

		} else {
			// We aren't loading, perhaps there was already a response?
			var response = props.confirmFinishVisitResponse;
			if(response !== null) {
				if(response.status == "success") {
					var link;
					if(response.toStage !== "__checkout__") {

						link = (
							React.createElement("a", {href: "/visits/stage/" + response.toStage + "/handle/" + response.visitID, className: "btn btn-link"}, 
								"Follow this visit"
							)
						);
					}
					message = (
						React.createElement("div", {className: "alert alert-success"}, 
							React.createElement("strong", null, "Awesome!"), " ", response.message, " ", link
						)
					);
				} else {
					var errorListItems = response.errors.map(function(error, index) {
						return (
							React.createElement("li", {key: index}, error)
						);
					});
					message = (
						React.createElement("div", {className: "alert alert-danger"}, 
							React.createElement("strong", null, "An error occurred:"), " ", response.message, 
							React.createElement("ul", null, errorListItems)
						)
					);
				}
			}
		}


		return (
			React.createElement("div", {className: "col-xs-12 col-sm-12 col-md-8 col-xl-9"}, 
	            React.createElement("h1", {className: "p-t text-xs-center"}, props.containerTitle), 
	            React.createElement("hr", null), 
            	message, 
            	patientsDOM, 
            	importBlock, 
            	controls
	        )
		);
	}
});


Visit.ImportBlock = React.createClass({displayName: "ImportBlock",

	getInitialState: function() {
		return {
			display: 'form',
			patientsFound: [],

			name: null,
			forceptID: null,
			fieldNumber: null,
		}
	},

	handleInputChange: function(input) {
		return function(event) {
			var state = this.state;
				state[input] = event.target.value;
			this.setState(state);
		}.bind(this);
	},

	handleSearch: function(type) {
		console.log("Handling click" + type);
		this.setState({
			display: 'searching'
		});

		$.ajax({
			type: "POST",
			url: "/patients/search",
			data: {
				_token: this.props._token,
				by: type,
				for: this.state[type]
			},
			success: function(resp) {
				this.setState({
					display: 'results',
					patientsFound: resp.patients
				});
			}.bind(this),
			error: function(resp) {

			},
			complete: function(resp) {

			}
		});
	},
	handlePatientAdd: function(patient) {
		return function(event) {
			this.props.onPatientAdd(patient);
			this.resetDisplay();
		}.bind(this);
	},

	resetDisplay: function() {
		this.setState(this.getInitialState());
	},

	doSearchName: function() {
		this.handleSearch("name");
	},
	doSearchForceptID: function() {
		this.handleSearch("forceptID");
	},
	doSearchFieldNumber: function() {
		this.handleSearch("fieldNumber");
	},

	render: function() {

		var state = this.state,
			props = this.props,
			display;

		switch(state.display) {
			case "form":
				display = (
					React.createElement("fieldset", {className: "form-group m-b-0"}, 
						React.createElement("label", {className: "form-control-label hidden-sm-up"}, "...by field number:"), 
						React.createElement("div", {className: "input-group input-group-lg m-b"}, 
	      					React.createElement("input", {type: "number", className: "form-control", placeholder: "Search for a patient by field number...", value: state.fieldNumber, onChange: this.handleInputChange("fieldNumber")}), 
							React.createElement("span", {className: "input-group-btn"}, 
								React.createElement("button", {className: "btn btn-secondary", type: "button", disabled: state.fieldNumber == null, onClick: this.doSearchFieldNumber}, "Search")
							)
						), 
						React.createElement("label", {className: "form-control-label hidden-sm-up"}, "...by Forcept ID:"), 
						React.createElement("div", {className: "input-group input-group-lg m-b"}, 
	      					React.createElement("input", {type: "number", className: "form-control", placeholder: "Search for a patient by Forcept ID...", min: "100000", value: state.forceptID, onChange: this.handleInputChange("forceptID")}), 
							React.createElement("span", {className: "input-group-btn"}, 
								React.createElement("button", {className: "btn btn-secondary", type: "button", disabled: state.forceptID == null, onClick: this.doSearchForceptID}, "Search")
							)
						), 
						React.createElement("label", {className: "form-control-label hidden-sm-up"}, "...by first or last name:"), 
						React.createElement("div", {className: "input-group input-group-lg"}, 
	      					React.createElement("input", {type: "text", className: "form-control", placeholder: "Search for a patient by first or last name...", value: state.name, onChange: this.handleInputChange("name")}), 
							React.createElement("span", {className: "input-group-btn"}, 
								React.createElement("button", {className: "btn btn-secondary", type: "button", disabled: state.name == null || state.name.length == 0, onClick: this.doSearchName}, "Search")
							)
						)
					)
				);
				break;
			case "searching":
				display = (
					React.createElement("h2", null, 
						React.createElement("img", {src: "/assets/img/loading.gif", className: "m-r"}), 
						"One moment, searching patients.."
					)
				);
				break;
			case "results":

				if(state.patientsFound.length == 0) {
					display = (
						React.createElement("div", {className: "alert alert-info"}, 
							"No patients found. ", React.createElement("a", {className: "alert-link", onClick: this.resetDisplay}, "Try again?")
						)
					)
				} else {
					display = (
						React.createElement("div", {className: "row"}, 
							state.patientsFound.map(function(patient, index) {
								var currentVisit;
								if(patient['current_visit'] !== null) {
									currentVisit = (
										React.createElement("li", {className: "list-group-item bg-danger"}, "Patient currently in a visit!")
									);
								}
								return (
									React.createElement("div", {className: "col-xs-12 col-sm-6", key: "patients-found-" + index}, 
										React.createElement("div", {className: "card"}, 
											React.createElement("div", {className: "card-header"}, 
												React.createElement("h5", {className: "card-title"}, 
													React.createElement("span", {className: "label label-default pull-right"}, patient['id']), 
													React.createElement("span", {className: "label label-primary pull-right"}, "#", index + 1), 
													React.createElement("span", {className: "title-content"}, (patient["full_name"] !== null && patient["full_name"].length > 0) ? patient["full_name"] : "Unnamed patient")
												)
											), 
											React.createElement("ul", {className: "list-group list-group-flush"}, 
												currentVisit
											), 
											React.createElement("div", {className: "card-block"}, 
												React.createElement("button", {type: "button", className: "btn btn-block btn-secondary", disabled: patient['current_visit'] !== null, onClick: this.handlePatientAdd(patient)}, 
													'\u002b', " Add"
												)
											)
										)
									)
								);
							}.bind(this))
						)
					);
				}

				break;
			default:
				break;
		}


		return (
			React.createElement("blockquote", {className: "blockquote"}, 
				React.createElement("h3", null, 
					'\u21af', " Import a patient", 
					React.createElement("button", {type: "button", className: "close pull-right", "aria-label": "Close", onClick: props.onClose}, 
					    React.createElement("span", {"aria-hidden": "true"}, "×")
					 )
				), 
				React.createElement("hr", null), 
				display
			)
		);
	}
});


/*
 * Display the controls for the new visit page
 *
 * Properties:
 *  - isLoading: boolean, is the container engaged in some sort of loading / modal process
 *  - isImportBlockVisible: if the import block is visible, disable the button
 *
 *  - onFinishVisit: callback for finishing visit
 *  - onPatientAddFromScratch: callback for clicking "Create new patient record"
 *  - onShowImportBlock: callback for showing the import block within PatientsContainer
 */
Visit.NewVisitControls = React.createClass({displayName: "NewVisitControls",
	render: function() {

		var props = this.props,
			loadingGifClasses = ("m-x loading" + (props.isLoading == false ? " invisible" : ""));

		return (
			React.createElement("div", {className: "btn-toolbar", role: "toolbar"}, 
				React.createElement("div", {className: "btn-group btn-group-lg p-b"}, 
		        	React.createElement("button", {type: "button", className: "btn btn-primary", disabled: props.isLoading, onClick: props.onPatientAddFromScratch}, '\u002b', " New"), 
		        	React.createElement("button", {type: "button", className: "btn btn-default", disabled: props.isLoading || props.isImportBlockVisible, onClick: props.onShowImportBlock}, '\u21af', " Import")
		        	), 
	        	React.createElement("div", {className: "btn-group btn-group-lg"}, 
	        		React.createElement("img", {src: "/assets/img/loading.gif", className: loadingGifClasses, width: "52", height: "52"}), 
	        		React.createElement("button", {type: "button", className: "btn btn-success", disabled: props.isLoading, onClick: props.onFinishVisit}, '\u2713', " Finish visit")
	        	)
	        )
	    );
	}

});


/*
 * Display the controls for the stage page
 *
 * Properties:
 *  - isLoading: boolean, is the container engaged in some sort of loading / modal process
 *
 *  - onFinishVisit: callback for finishing visit
 */
Visit.StageVisitControls = React.createClass({displayName: "StageVisitControls",

	render: function() {

		var props = this.props,
			loadingGifClasses = ("m-x" + (props.isLoading == false ? " invisible" : ""));

		return (
			React.createElement("div", {className: "btn-toolbar", role: "toolbar"}, 
				React.createElement("div", {className: "btn-group btn-group-lg"}, 
		        	React.createElement("img", {src: "/assets/img/loading.gif", className: loadingGifClasses, width: "52", height: "52"}), 
	        		React.createElement("button", {type: "button", className: "btn btn-success", disabled: props.isLoading, onClick: props.onFinishVisit}, "Finish visit »")
		        )
	        )
	    );
	}

});



/*
 * Display specified fields relative to this patient
 *
 * Properties:
 */
Visit.Patient = React.createClass({displayName: "Patient",

	/*
	 *
	 */
	handleFieldChange: function(fieldID, value) {
		// Continue bubbling event from Fields.whatever to top-level Visit container
		// (this element passes along the patient ID to modify)
		this.props.onPatientDataChange(this.props.id, fieldID, value);
	},

	/*
	 *
	 */
	handleStoreResource: function(resourceID, resource) {
		// Continue bubbling event from Fields.whatever to top-level Visit container
		// (this element passes along the patient ID to modify)
		this.props.onStoreResource(resourceID, resource);
	},

	/*
	 *
	 */
	render: function() {

		var props = this.props,
			state = this.state,

			fields = props.fields,
			fieldKeys = Object.keys(fields),
			countFields = fieldKeys.length,

			summaryFields = props.summaryFields,
			summaryFieldsKeys = Object.keys(summaryFields),
			countSummaryFields = summaryFieldsKeys.length,

			name = props.patient.full_name !== null ? props.patient.full_name : "Unnamed patient",
			summary;

		console.log("[Visit.Patient] Preparing to render " + countFields + " iterable fields, " + countSummaryFields + " fields to summarize");

		// Build summary DOM
		if(summaryFields !== null && typeof summaryFields === "object" && countSummaryFields > 0) {

			var leftColumnFields = {},
				rightColumnFields = {},
				patientsObjectSpoof = {};

			patientsObjectSpoof[props.patient.patient_id] = props.patient;

			summaryFieldsKeys.map(function(key, index) {
				if(index > (countSummaryFields - 1) / 2) {
					rightColumnFields[key] = summaryFields[key];
				} else {
					leftColumnFields[key] = summaryFields[key];
				}
			}.bind(this));

			console.log("[Visit.Patient] " + Object.keys(leftColumnFields).length + " fields in the left column");
			console.log("[Visit.Patient] " + Object.keys(rightColumnFields).length + " fields in the right column");

			summary = (
				React.createElement("div", {className: "row"}, 
					React.createElement(Visit.PatientsOverview, {
						fields: leftColumnFields, 
						patients: patientsObjectSpoof, 
						mini: true}), 
					React.createElement(Visit.PatientsOverview, {
						fields: rightColumnFields, 
						patients: patientsObjectSpoof, 
						mini: true})
				)
			);
		}


		return (
			React.createElement("blockquote", {className: "blockquote"}, 
				React.createElement("h3", null, 
					React.createElement("span", {className: "label label-info"}, "#", props.hasOwnProperty('index') ? props.index + 1 : "?"), 
		            React.createElement("span", {className: "label label-default"}, props.hasOwnProperty('id') ? props.id : "?"), "  ", 
		            React.createElement("span", {className: "hidden-xs-down"}, name), 
		            React.createElement("div", {className: "hidden-sm-up p-t"}, name)
		        ), 
		        summary, 
		        React.createElement("hr", null), 
		        fieldKeys.map(function(fieldID, index) {

					var thisField = fields[fieldID];
					var thisPatient = props.patient;

		        	// Figure out which type of field we should render
		        	switch(thisField.type) {

		        		/*
		        		 * Input field types
		        		 */
		        		case "text":
		        			return (
		        				React.createElement(Fields.Text, React.__spread({}, 
		        					thisField, 
		        					{defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "textarea":
		        			return (
		        				React.createElement(Fields.Textarea, React.__spread({}, 
		        					thisField, 
		        					{defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "number":
		        			return (
		        				React.createElement(Fields.Number, React.__spread({}, 
		        					thisField, 
		        					{defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "date":
		        			return (
		        				React.createElement(Fields.Date, React.__spread({}, 
		        					thisField, 
		        					{defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "select":
							return (
		        				React.createElement(Fields.Select, React.__spread({}, 
		        					thisField, 
		        					{multiple: false, 
		        					defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "multiselect":
		        			return (
		        				React.createElement(Fields.Select, React.__spread({}, 
		        					thisField, 
		        					{multiple: true, 
		        					defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "file":
		        			return (
								React.createElement(Fields.File, React.__spread({}, 
		        					thisField, 
		        					{defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
									onStore: this.handleStoreResource, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "yesno":
		        			return (
								React.createElement(Fields.YesNo, React.__spread({}, 
		        					thisField, 
		        					{defaultValue: thisPatient.hasOwnProperty(fieldID) ? thisPatient[fieldID] : null, 
		        					onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;

		        		/*
		        		 * Other fields
		        		 */
		        		case "header":
		        			return (
		        				React.createElement(Fields.Header, React.__spread({}, 
		        					thisField, 
		        					{key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;
		        		case "pharmacy":
		        			return (
		        				React.createElement(Fields.Pharmacy, React.__spread({}, 
		        					thisField, 
		        					{onChange: this.handleFieldChange, 
		        					key: fieldID, 
		        					id: fieldID}))
		        			);
		        			break;

		        		/*
		        		 * Field type not recognized
		        		 */
		        		default:
		        			return (
		        				React.createElement("div", {className: "alert alert-danger"}, 
		        					React.createElement("strong", null, "Warning:"), " Unrecognized input type ", thisField['type']
		        				)
		        			);
		        			break;
		        	}
		        }.bind(this))
			)
		);
	}

});

/*
 * Modal that appears upon clicking "Finish visit"
 *
 * Properties
 *   - stages: array of stage objects (in order of 'order')
 *   - currentStage: current stage id
 *   - onConfirmFinishVisit: handler function for logic after moving patients
 */
Visit.FinishModal = React.createClass({displayName: "FinishModal",

	getInitialState: function() {
		return {
			isSubmitting: false,
		};
	},

	/*
	 * onComplete
	 */
	onComplete: function() {
		this.setState({
			isSubmitting: true
		});
		this.props.onConfirmFinishVisit(this.state.destination, this);
	},

	/*
	 * Handle destination change
	 */
	handleDestinationChange: function(destination) {
		return function(event) {
			console.log("[Visit.FinishModal] Changing destination to " + destination);
			this.setState({
				destination: destination
			});
		}.bind(this);
	},

	/*
	 * Check if a default value is going to be set
	 */
	componentWillMount: function() {
		this.resetSelectState();
	},

	resetSelectState: function() {

		var props = this.props;

		// Set default value as the first stage in the array (the next stage in order above the current one)
		if(props.hasOwnProperty('stages') && props.stages !== null && props.stages.length > 0) {
			this.setState({ destination: props.stages[0].id });
		} else {
			this.setState({ destination: "__checkout__" });
		}
	},

	/*
	 * Render the modal
	 */
	render: function() {

		var props = this.props,
			state = this.state,
			destinations,
			buttonText,
			defaultValue,
			stageNameKeyPairs = {};

		// Check if stages are defined, use them as destinations
		// NOTE: stages are in order of ORDER, not ID
		if(props.hasOwnProperty('stages') && props.stages.length > 0) {
			destinations = props.stages.map(function(stage, index) {
				stageNameKeyPairs[stage.id] = stage.name;
				return (
					React.createElement("label", {className: "btn btn-secondary btn-block" + (stage.id == state.destination ? " active" : ""), key: "finish-modal-option" + index, onClick: this.handleDestinationChange(stage['id'])}, 
						React.createElement("input", {type: "radio", name: "destination", defaultChecked: stage.id == state.destination}), 
						stage.id == state.destination ? "\u2713" : "", " ", stage.name
					)
				);
			}.bind(this));
		}

		// Change button text based on modal state
		if(state.isSubmitting == true) {
			buttonText = "Working...";
		} else {
			if(state.destination == "__checkout__") {
				buttonText = "Check-out patients";
			} else {
				buttonText = "Move patients to " + (state.destination !== null ? stageNameKeyPairs[state.destination] : stageNameKeyPairs[defaultValue]);
			}
		}

		return (
			React.createElement("div", {className: "modal fade", id: "visit-finish-modal"}, 
			    React.createElement("div", {className: "modal-dialog modal-sm", role: "document"}, 
			        React.createElement("div", {className: "modal-content"}, 
			            React.createElement("div", {className: "modal-header"}, 
			                React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-label": "Close"}, 
			                  React.createElement("span", {"aria-hidden": "true"}, "×")
			                ), 
			                React.createElement("h4", {className: "modal-title"}, "Move visit to...")
			            ), 
			            React.createElement("div", {className: "modal-body"}, 
			            	React.createElement("div", {className: "btn-group-vertical btn-group-lg", style: {display: "block"}, "data-toggle": "buttons"}, 
			            		destinations, 
								React.createElement("label", {className: "btn btn-secondary btn-block" + ("__checkout__" == state.destination ? " active" : ""), onClick: this.handleDestinationChange("__checkout__")}, 
									React.createElement("input", {type: "radio", name: "destination", defaultChecked: "__checkout__" == state.destination}), 
									"__checkout__" == state.destination ? "\u2713" : "", " Check-out"
								)
			            	)
			            ), 
			            React.createElement("div", {className: "modal-footer"}, 
			                React.createElement("button", {type: "button", className: "btn btn-success", disabled: state.isSubmitting == true, onClick: this.onComplete}, 
			                	buttonText
			                )
			            )
			        )
			    )
			)
		);
	}

});