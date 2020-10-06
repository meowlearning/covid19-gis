import React, { Component } from 'react';
import { Spin, Card, Select } from 'antd';
import { ResponsiveLine } from '@nivo/line';
import Tooltip from "./Tooltip";
import './Graph.css'
const axios = require('axios');
const { Option } = Select;

class Graph extends Component {
    state = {
        info: "This show the detailed graph based on the selected country and selected case",
        data: null,
        mappedData: null,
        SelectedCase: "Confirmed",
        options: {
            case: ["Confirmed", "Deaths", "Recovered"]
        },
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
                    mappedData: null
                })
            } else if (this.props.data.length === 0) { // data unavailable
                this.setState({
                    loading: false,
                    dataUnavailable: true,
                    mappedData: []
                })
            } else {
                this.setState({
                    loading: true,
                    dataUnavailable: false,
                    mappedData: null
                }, () => {
                    this.mapData(this.props.data, this.state.SelectedCase);
                })
            }
        }
    }

    mapData(data, selectedCase) {
        let tempData = [];

        tempData = data.map(d => (
            {
                x: d._id.date,
                y: d[selectedCase.toLowerCase()]
            }
        ));

        this.setState({
            mappedData: tempData,
            dataUnavailable: false,
            loading: false
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
            console.log(this.state.mappedData);
            if ((!this.state.dataUnavailable)) {
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
                            type: "linear",
                            min: "auto",
                            max: "auto",
                            stacked: false,
                            reverse: false
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisLeft={{
                            orient: "left",
                            tickSize: 5,
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
                        }} />
            } else {
                page = <h1>Data is NOT Available</h1>;
            }
        } else {
            page = <Spin className="Loading" tip="Loading..." />;
        }
           

        // // if ((this.state.dataUnavailable === true)) { // if data is unavailable
        // //     page = <h1>Data is NOT Available</h1>;
        // // } else if (this.state.loading === true) { // if data is available but still loading
        // //     page = <Spin className="Loading" tip="Loading..." />;
        // // } else if ((this.state.loading !== true) && (this.state.dataUnavailable !== true)) { // server the data
        // //     page =
        // //         <ResponsiveLine
        // //             data={this.state.mappedData}
        // //             margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        // //             xScale={{
        // //                 type: "time",
        // //                 format: "%Y-%m-%dT%H:%M:%S.%L%Z"
        // //             }}
        // //             xFormat="time:%Y-%m-%d"
        // //             yScale={{
        // //                 type: "linear",
        // //                 min: "auto",
        // //                 max: "auto",
        // //                 stacked: false,
        // //                 reverse: false
        // //             }}
        // //             axisTop={null}
        // //             axisRight={null}
        // //             axisLeft={{
        // //                 orient: "left",
        // //                 tickSize: 5,
        // //                 tickPadding: 5,
        // //                 tickRotation: 0,
        // //                 legend: "count",
        // //                 legendOffset: -40,
        // //                 legendPosition: "middle"
        // //             }}
        // //             axisBottom={{
        // //                 format: "%b %d",
        // //                 tickValues: "every 2 days",
        // //                 tickRotation: -90,
        // //                 legend: "time scale",
        // //                 legendOffset: -12
        // //             }} />
        // }




        return (
            <Card title={`Selected Region Graph`} extra={<Tooltip info={this.state.info} />}>

                <Select defaultValue={this.state.SelectedCase} style={{ width: 150 }} onChange={this.handleSelectedCaseChange}>
                    {this.state.options.case.map((c) => {
                        return <Option value={c}>{c}</Option>
                    })}
                </Select>
                <div className="graph-container" style={{ height: "60vh", width: "100%" }}>
                    {page}
                </div>

            </Card>
        );
    }
}

export default Graph;