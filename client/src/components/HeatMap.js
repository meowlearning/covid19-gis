import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';

import { Spin, Popover } from 'antd';
import "./HeatMap.css";


class HeatMap extends Component {
    state = {
        API_KEY: {
            google: process.env.REACT_APP_GOOGLE_API || "AIzaSyA-AXXI0TXe55-vlmyJPOFg8gL5bnATQMY"
        },
        default: {
            map: {
                center: {
                    lat: 0,
                    lng: 0,
                },
                zoom: 0
            }
        },
        selected: {
            map: {
                center: {
                    lat: 0,
                    lng: 0
                },
                zoom: 0
            },
            countryName: null
        },
        ref: {
            maps: null,
            map: null,
            marker: null
        }
    }


    constructor() {
        super();
    }


    componentDidUpdate(prevProps) {
        if ((prevProps.lat !== this.props.lat) || (prevProps.lng !== this.props.lng)) {
            this.setState({
                selected: {
                    map: {
                        center: {
                            lat: this.props.lat,
                            lng: this.props.lng
                        },
                        zoom: this.props.zoom
                    },
                    countryName: this.props.countryName
                }
            })
        }
    }



    render() {
        return (
            <div className="Map" style={{ height: "50vh", width: "100%" }}>
                {(this.props.coordinates != null) ?
                    <GoogleMapReact
                        bootstrapURLKeys={{ key: this.state.API_KEY.google }}
                        defaultCenter={this.state.default.map.center}
                        center={this.state.selected.map.center}
                        zoom={this.state.selected.map.zoom}
                        defaultZoom={this.state.default.map.zoom}
                        heatmapLibrary={true}
                        heatmap={this.props.coordinates}
                    >
                        {this.props.children}
                    </GoogleMapReact>
                    : <Spin className="Loading" tip="Loading..." />}

            </div>
        );
    }
}

export default HeatMap;