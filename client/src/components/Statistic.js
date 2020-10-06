import React, { Component } from 'react';
import { ResponsiveBar } from '@nivo/bar'
import { Statistic, Spin, Card, Divider, Row, Col } from 'antd';
import CustomTooltip from './CustomTooltip';
import "./StatisticSummary.css";

class StatisticSummary extends Component {
    state = {
        info: "This gives Summary of the World Situation",
        data: {
            graph: null
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            this.setState({
                data: {
                    graph: [{
                        "case": "Confirmed",
                        "Confirmed": this.props.data.confirmed,
                        "color": "#8dd3c7"
                    }, {
                        "case": "Active",
                        "Active": this.props.data.active,
                        "color": "#fb8072"
                    }, {
                        "case": "Recovered",
                        "Recovered": this.props.data.recovered,
                        "color": "#bebada"
                    }, {
                        "case": "Deaths",
                        "Deaths": this.props.data.deaths,
                        "color": "#ffb300"
                    }],
                }
            })
        }
    }

    render() {
        const data = this.state.data.graph;

        return (
            <Card title="World Statistic" extra={<CustomTooltip info={this.state.info} />}>

                <div className="graph-summary" style={{ width: "100%", height: "36.3vh" }}>
                    {(data !== null) ?
                        <ResponsiveBar
                            data={data}
                            keys={data.map(c => c.case)}
                            indexBy="case"
                            colors={data.map(c => c.color)}
                            labelTextColor="none"
                            animate={true}
                            motionStiffness={115}
                            motionDamping={15}
                        /> : <Spin className="Loading" tip="Loading..." />
                    }
                </div>

                <Divider type="horizontal" />
                <br />
                <br />
                <div className="Statistic-summary" >
                    {(this.props.data !== null && data !== null) ?
                        <div className="Container">
                            <Row gutter={[48, 48]}>
                                <Col key="Confirmed" span={12}>
                                    <Statistic title="Confirmed" value={this.props.data.confirmed} valueStyle={{ color: data.find(c => c.case === "Confirmed").color }} />
                                </Col>
                                <Col key="Deaths" span={12}>
                                    <Statistic title="Deaths" value={this.props.data.deaths} valueStyle={{ color: data.find(c => c.case === "Deaths").color }} />
                                </Col>
                            </Row>
                            <Row gutter={[48, 48]}>
                                <Col key="Recovered" span={12}>
                                    <Statistic title="Recovered" value={this.props.data.recovered} valueStyle={{ color: data.find(c => c.case === "Recovered").color }} />
                                </Col>
                                <Col key="Active" span={12}>
                                    <Statistic title="Active" value={this.props.data.active} valueStyle={{ color: data.find(c => c.case === "Active").color }} />
                                </Col>
                            </Row>
                        </div>
                        : <Spin className="Loading" tip="Loading..." />}
                </div>
            </Card>
        );
    }
}

export default StatisticSummary;