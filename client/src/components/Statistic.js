import React, { Component } from 'react';
import { ResponsiveBar } from '@nivo/bar'
import { Statistic, Spin, Card, Divider } from 'antd';
import Tooltip from './Tooltip';
import "./StatisticSummary.css";

class StatisticSummary extends Component {
    state = {
        info:"This gives Summary of the World Situation",
        data: {
            graph: null
        }
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps) {
        if (prevProps.data != this.props.data) {
            this.setState({
                data: {
                    graph: [{
                        "case": "Confirmed",
                        "Confirmed": this.props.data.confirmed,
                        "ConfirmedColor": "hsl(0, 0%, 0%)"
                    }, {
                        "case": "Deaths",
                        "Deaths": this.props.data.death,
                        "DeathsColor": "hsl(355, 83%, 44%)"
                    }, {
                        "case": "Recovered",
                        "Recovered": this.props.data.recovered,
                        "RecoveredColor": "hsl(92, 100%, 26%)"
                    }]
                }
            })
        }
    }

    render() {
        return (
            <Card title="World Statistic"  extra={<Tooltip info={this.state.info}/>}>
                
                <div className="graph-summary" style={{ width: "100%", height: "29.3vh" }}>
                    {(this.state.data.graph !== null) ?
                        <ResponsiveBar
                            data={this.state.data.graph}
                            keys={["Confirmed", "Deaths", "Recovered"]}
                            indexBy="case"
                            colors={{ scheme: 'set3' }}
                            labelTextColor="none"
                            animate={true}
                            motionStiffness={115}
                            motionDamping={15}
                        /> : <Spin className="Loading" tip="Loading..." />
                    }
                </div>

                <Divider type="horizontal" />

                <div className="Statistic-summary" >
                    {(this.props.data != null) ?
                        <div className="Container">
                            <Statistic title="Confirmed" value={this.props.data.confirmed} valueStyle={{color: "#8DD3C7"}}/>
                            <Statistic title="Death" value={this.props.data.death} valueStyle={{ color: '#FDF5B3' }} />
                            <Statistic title="Recovered" value={this.props.data.recovered} valueStyle={{ color: '#BEBADA' }} />
                        </div>
                        : <Spin className="Loading" tip="Loading..." />}
                </div>
            </Card>
        );
    }
}

export default StatisticSummary;