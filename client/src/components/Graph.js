import React, { Component } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js';
import { Spin } from 'antd';
import { ResponsiveLine } from '@nivo/line';
import './Graph.css'
const axios = require('axios');


class Graph extends Component {
    state = {
        data: null,
        mapedData: null,
        graph: {
            layout: {
                autosize: true,
                showlegend: true,
            }
        }
    }

    componentDidMount() {
        this.mapData = this.mapData.bind(this);

        let mappedData = sessionStorage.getItem("mapped-data");
        if (mappedData) {
            this.setState({
                mapedData: JSON.parse(mappedData)
            })
        } else {

            axios.get('/api/graph')
                .then(({ data }) => {
                    this.mapData(data);
                });
        }
    }

    mapData(data) {
        let tempData = [];
        data.map((d) => {
            let id = d._id;
            let XY = [];
            d.data.map((x) => {
                XY.push({
                    x: x.date,
                    y: x.confirmed
                })
            })
            tempData.push({
                id: id,
                data: XY
            })
        })

        console.log(tempData)
        sessionStorage.setItem("mapped-data", JSON.stringify(tempData));
        this.setState({
            mapedData: tempData
        })
    }

    render() {
        //const Plot = createPlotlyComponent(Plotly);
        return (
            
            <div className="graph-container" style={{width: "100vw", height: "50vh"}}>
                { (this.state.mapedData !== null) ?
                    <ResponsiveLine
                        data={this.state.mapedData}
                        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                        useMesh={true}
                        axisBottom={{
                            orient: 'bottom',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Date',
                            legendOffset: 36,
                            legendPosition: 'middle'
                        }}
                        axisLeft={{
                            orient: 'left',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'selectedCase',
                            legendOffset: -40,
                            legendPosition: 'middle'
                        }}
                    /> : <Spin className="Loading" tip="Loading..." />}

            </div>
        );
    }
}

export default Graph;