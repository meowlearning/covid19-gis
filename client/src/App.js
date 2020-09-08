import React, { Component } from 'react';
import HeatMap from './components/HeatMap';
import StatisticSummary from './components/Statistic';
import { Layout } from 'antd';
import './App.css';
const axios = require("axios").default;
const { Header, Footer, Sider, Content } = Layout;

class App extends Component {

  state = {
    data: {
      statistic: null,
      map: null
    }
  }


  componentDidMount() {
    axios.get("http://localhost:8393/api/data")
      .then(({ data }) => {
        console.log(data)
        // construct the data
        let positions = [];
        let confirmedCaseTotal = 0;
        let deathCaseTotal = 0;
        let recoveredCaseTotal = 0;
        data.data.map((d) => {

          // data for Heatmap
          if (d.data.location !== null) {
            positions.push({ lat: d.data.location.coordinates[1], lng: d.data.location.coordinates[0] })
          }
          // data for statistic
          confirmedCaseTotal += d.data.case.confirmed;
          deathCaseTotal += d.data.case.death;
          recoveredCaseTotal += d.data.case.recovered;
        });

        this.setState({
          data: {
            map: {
              positions: positions,
              options: {
                radius: 20
              }
            },
            statistic: {
              confirmed: confirmedCaseTotal,
              death: deathCaseTotal,
              recovered: recoveredCaseTotal
            }
          }
        })

      });
  }


  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Content><HeatMap coordinates={this.state.data.map} /></Content>
        <Footer><StatisticSummary data={this.state.data.statistic}/></Footer>
      </Layout>
    );
  }
}

export default App;
