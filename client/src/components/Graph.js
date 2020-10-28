import React, { Component } from 'react';
import { Spin, Card, Select, Empty, Row, Col } from 'antd';
import { ResponsiveLine } from '@nivo/line';
import CustomTooltip from "./CustomTooltip";
import './Graph.css'
const { Option } = Select;
const d3 = require('d3-scale');

class Graph extends Component {
    state = {
        info: "This show the detailed graph based on the selected country and selected case",
        mappedData: null,
        SelectedCase: "confirmed",
        options: {
            case: [
                {
                    value: "weekly_confirmed",
                    text: "Weekly Confirmed"
                },
                {
                    value: "weekly_deaths",
                    text: "Weekly Deaths"
                },
                {
                    value: "confirmed",
                    text: "Confirmed"
                },
                {
                    value: "deaths",
                    text: "Deaths"
                },
                {
                    value: "recovered",
                    text: "Recovered"
                },
                {
                    value: "log_confirmed",
                    text: "Log Confirmed"
                }
            ]
        },
        scale: "linear",
        loading: false,
        dataUnavailable: true
    }

    constructor() {
        super();
        this.handleSelectedCaseChange = this.handleSelectedCaseChange.bind(this);
        this.mapData = this.mapData.bind(this);
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps) {
        // if there is change in selected country or selected case
        // get new data and map it
        if ((prevProps.data !== this.props.data)) {
            if (this.props.data === null) { // loading
                this.setState({
                    loading: true,
                    dataUnavailable: false,
                })
            } else if (this.props.data.length === 0) { // data unavailable
                this.setState({
                    loading: false,
                    dataUnavailable: true,
                })
            } else {
                this.mapData(this.props.data, this.state.SelectedCase);
            }
        }
    }

    mapData(data, selectedCase) {
        let tempData = [];
        let offset = 0;
        let scale = 'linear';

        // in case we need another log for another case
        if (selectedCase.includes("log") && selectedCase.includes("confirmed")) {
            selectedCase = "confirmed";
            offset = 1;
            scale = 'log';
        }

        tempData = data.map(d => (
            {
                x: d._id.date,
                y: (d[selectedCase] || 0) <= 0 ? offset : d[selectedCase]
            }
        ));

        this.setState({
            mappedData: tempData,
            dataUnavailable: false,
            loading: false,
            scale: scale
        })

    }

    handleSelectedCaseChange(value) {
        this.mapData(this.props.data, value)
        this.setState({
            SelectedCase: value
        })
    }

    render() {
        let page = <h1>Data is NOT Available</h1>;

        if ((!this.state.loading)) {
            if ((!this.state.dataUnavailable)) {
                const max = Math.max.apply(Math, this.state.mappedData.map(d => d.y))
                const min = Math.min.apply(Math, this.state.mappedData.map(d => d.y))
                let unitScale;
                let tickValues

                if (this.state.scale === "linear") {
                    unitScale = d3.scaleLinear().domain([min, max]);
                    tickValues = unitScale.ticks(10);
                } else if (this.state.scale === "log") {
                    unitScale = d3.scaleLog().domain([min, max]);
                    let format10 = unitScale.tickFormat(10, "");
                    tickValues = unitScale.ticks(10).map(format10);
                }

                page =
                    <ResponsiveLine
                        data={
                            [
                                {
                                    "id": "region",
                                    "data": this.state.mappedData
                                }
                            ]
                        }
                        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                        xScale={{
                            type: "time",
                            format: "%Y-%m-%dT%H:%M:%S.%L%Z"
                        }}
                        xFormat="time:%Y-%m-%d"
                        yScale={{
                            type: this.state.scale,
                            min: "auto",
                            max: "auto",
                            stacked: false,
                            reverse: false
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisLeft={{
                            format: ".2s",
                            orient: "left",
                            tickSize: 5,
                            tickValues: tickValues.filter(v => v !== ""),
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "count",
                            legendOffset: -40,
                            legendPosition: "middle"
                        }}
                        axisBottom={{
                            format: "%b %d",
                            //tickValues: "every 2 days",
                            // tickRotation: -90,
                            legend: "time scale",
                            legendOffset: -12
                        }}
                        isInteractive={true}
                        useMesh={true}
                    />
            } else {
                page = <Empty />;
            }
        } else {
            page = <Spin className="Loading" tip="Loading..." />;
        }


        return (
            <Card title={`Selected Region Graph`} extra={<CustomTooltip info={this.state.info} />}>
                <Row gutter={[8, 24]}>
                    <Col span={24} >
                        <Select
                            defaultValue={this.state.SelectedCase}
                            disabled={!this.props.data || !this.props.data.length}
                            style={{ width: 150 }}
                            onChange={this.handleSelectedCaseChange}>
                            {this.state.options.case.map((c) => {
                                return <Option key={c.value} value={c.value}>{c.text}</Option>
                            })}
                        </Select>
                    </Col>
                </Row>
                <Row gutter={[8, 24]}>
                    <Col span={24} >
                        <div className="graph-container" style={{ height: "43vh", width: "100%" }}>
                            {page}
                        </div>
                    </Col>
                </Row>
            </Card>
        );
    }
}

export default Graph;