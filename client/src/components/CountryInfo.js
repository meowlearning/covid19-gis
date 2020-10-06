import React, { Component } from 'react'
import { Card, Spin, Breadcrumb } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import Tooltip from "./Tooltip";

const axios = require('axios');


class CountryInfo extends Component {

    state = {
        info: "This is for selected country Information",
        loading: true
    }

    componentDidMount() {
        console.log(this.props.data);
    }

    componentDidUpdate(prevProps) {
       if(prevProps.data != this.props.data){
         console.log(prevProps.data)
         console.log(this.props.data)
       }
    }


    render() {
    
        return (
            <Card title={`Regional Info`} extra={<Tooltip info={this.state.info} />}>
                <div className="country-info-container" style={{ width: "100%", height: "50vh" }}>
                 
                </div>
            </Card>
        )
    }
}

export default CountryInfo;