Fields.Textarea = React.createClass({
	onTextareaInputChange: function(event) {
		// Bubble event up to handler passed from Visit
		// (pass field ID and event)
		this.props.onChange(this.props.id, event.target.value);
	},

	render: function() {
		return (
			<div className="form-group row">
				<Fields.FieldLabel {...this.props} />
				<div className={Fields.inputColumnClasses}>
					<textarea
						className="form-control"
						autoComplete="off"
						maxLength="255"

						id={this.props.id}
						placeholder={this.props.name + " goes here"}
						defaultValue={this.props.defaultValue !== null ? this.props.defaultValue : null}
						onChange={this.onTextareaInputChange} />
				</div>
			</div>
		);
	}
});