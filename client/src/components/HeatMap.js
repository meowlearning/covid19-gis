import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import { Spin } from 'antd';
import "./HeatMap.css";

class HeatMap extends Component {
    state = {
        API_KEY: {
            google: "AIzaSyAWXpBEjciqdQaoVLP474k7VhrNVsItVzw"
        },
        default: {
            map: {
                center: {
                    lat: 0,
                    lng: 0,
                },
                zoom: 0
            }
        }
    }

    constructor(props) {
        super(props);
    }


    render() {
        return (
            <div className="Map" style={{ height: "50vh", width: "100%" }}>
                {(this.props.coordinates != null) ?
                    <GoogleMapReact
                        bootstrapURLKeys={{ key: this.state.API_KEY.google }}
                        defaultCenter={this.state.default.map.center}
                        defaultZoom={this.state.default.map.zoom}
                        heatmapLibrary={true}
                        heatmap={this.props.coordinates}
                    /> : <Spin className="Loading" tip="Loading..." />}

            </div>
        );
    }
}

export default HeatMap;