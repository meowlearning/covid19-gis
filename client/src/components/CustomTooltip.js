import React, { Component } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from "antd";
import './Tooltip.css'

class CustomTooltip extends Component {
    render() {
        return (
            <Tooltip title={this.props.info}>
                <InfoCircleOutlined />
            </Tooltip>
        )
    }
}


export default CustomTooltip;