import React, { Component } from 'react';
import { Spin, Card } from 'antd';
import { ResponsiveLine } from '@nivo/line';
import Tooltip from "./Tooltip";
import './Graph.css'
const axios = require('axios');


class Graph extends Component {
    state = {
        info: "This show the detailed graph based on the selected country and selected case",
        data: null,
        mapedData: null,
        graph: {
            layout: {
                autosize: true,
                showlegend: true,
            }
        },
        loading: true,
        dataUnavailable: false
    }

    componentDidMount() {
        this.mapData = this.mapData.bind(this);
        let mappedData = sessionStorage.getItem("mapped-data");
        if (mappedData) {
            this.setState({
                loading: false,
                dataUnavailable: false,
                mapedData: JSON.parse(mappedData)
            })
        } else {
            axios.post('/api/graph', {
                countries: [this.props.selectedCountry],
                case: this.props.selectedCase
            }).then(({ data }) => {
                this.mapData(data.result); 
            });
        }
    }

    componentDidUpdate(prevProps) {
        
        // if there is change in selected country or selected case
        // get new data and map it
        if ((prevProps.selectedCountry !== this.props.selectedCountry) || (prevProps.selectedCase !== this.props.selectedCase)) {

            this.setState({
                loading: true,
                dataUnavailable: false,
                mappedData: null
            }, () => {
                axios.post('/api/graph', {
                    countries: [this.props.selectedCountry],
                    case: (this.props.selectedCase).toLowerCase()
                }).then(({ data }) => {
                    this.mapData(data.result)
    
                });

            })

        }
    }

    mapData(data) {
        if(data.length !== 0){
            let tempData = [];
            data.map((d) => {
                let id = d._id;
                let XY = [];
                d.data.map((x) => {
                    XY.push({
                        x: x.date,
                        y: x.case
                    })
                })
                tempData.push({
                    id: id,
                    data: XY
                })
            })

            sessionStorage.setItem("mapped-data", JSON.stringify(tempData));
            this.setState({
                mapedData: tempData,
                loading: false,
                dataUnavailable: false
            })
        }else{
            this.setState({
                dataUnavailable: true,
                loading: false,
                mapData: null
            })
        }
    }

    render() {
        let page = <h1>Data is NOT Available</h1>;

        if((this.state.dataUnavailable === true)){ // if data is unavailable
            page = <h1>Data is NOT Available</h1>;
        }else if(this.state.loading === true){ // if data is available but still loading
            page = <Spin className="Loading" tip="Loading..." />;
        }else if( (this.state.loading !== true) && (this.state.dataUnavailable !== true) ){ // server the data
            page = 
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
                        legend: this.props.selectedCase,
                        legendOffset: -40,
                        legendPosition: 'middle'
                    }}
                />
        }
        return (
            <Card title={`Selected Country Graph -- ${this.props.selectedCountry}`} extra={<Tooltip info={this.state.info}/>}>
                 <div className="graph-container" style={{ height: "60vh", width: "100%" }}>
                    {page}
                 </div>
            </Card>
        );
    }
}

export default Graph;