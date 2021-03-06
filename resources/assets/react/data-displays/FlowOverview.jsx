
/*
 * Flow Overview
 *
 * Properties:
 *
 */
DataDisplays.FlowOverview = React.createClass({

	getInitialState: function() {
		return {
			stages: {}
		};
	},

	update: function() {
		$.ajax({
			type: "GET",
			url: "/data/visits/count",
			data: {
				from: this.state.from,
				to: this.state.to
			},
			success: function(resp) {
				this.setState({
					stages: resp.stages,
				});
			}.bind(this),
			error: function(resp) {

			},
			complete: function(resp) {
			}
		});
	},

	componentWillMount: function() {
		DataDisplays.setupDates(this);
	},

	changeFromDate: function(event) {
		this.setState({
			from: event.target.value
		});
	},

	changeToDate: function(event) {
		this.setState({
			to: event.target.value
		});
	},

	render: function() {
		return (
			<div className="row">
				{Object.keys(this.state.stages).map(function(stageID, index) {
					return (
						<div className="col-xs-12 col-sm-6 col-md-4 col-lg-2" key={"flow-overview-stage-" + index}>
							<div className="card">
								<div className="card-block">
									<h4 className="card-title text-xs-center m-b">
										{this.state.stages[stageID].name}
									</h4>
									<hr/>
									<div className="row">
										<div className="col-xs-12 col-sm-6 text-xs-center">
											<h2><span className="label label-primary label-rounded">{this.state.stages[stageID]['visits']}</span></h2>
											<h5 className="text-muted">visit{this.state.stages[stageID]['visits'] == 1 ? "" : "s"}</h5>
										</div>
										<div className="col-xs-12 col-sm-6 text-xs-center">
											<h2><span className="label label-primary label-rounded">{this.state.stages[stageID]['patients']}</span></h2>
											<h5 className="text-muted">patient{this.state.stages[stageID]['patients'] == 1 ? "" : "s"}</h5>
										</div>
									</div>
								</div>
							</div>
						</div>
					);
				}.bind(this))}
				<div className="col-xs-12">
					<DataDisplays.RangeModule
						from={this.state.from}
						to={this.state.to}
						onChangeFrom={this.changeFromDate}
						onChangeTo={this.changeToDate} />
				</div>
			</div>
		);

	}

});
