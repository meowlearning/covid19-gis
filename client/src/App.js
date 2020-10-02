import React, { Component } from 'react';
import HeatMap from './components/HeatMap';
import Graph from './components/Graph';
import StatisticSummary from './components/Statistic';
import CountryInfo from './components/CountryInfo';
import { Layout, Select, Row, Col } from 'antd';
import './App.css';
const CountryOtions = require('./components/data/CountryCoord.json');
const axios = require("axios").default;
const { Header, Footer, Content, Sider } = Layout;
const { Option } = Select;

const fs = require('fs');

class App extends Component {

  state = {
    data: {
      statistic: null,
      map: null
    },
    selected: {
      map: {
        lat: 0,
        lng: 0,
        zoom: 0
      },
    },
    SelectedCase: "Confirmed",
    countryOption: "Global",
    options: {
      case: ["Confirmed", "Deaths", "Recovered"]
    }
  }

  constructor() {
    super();
    this.handleCountryOptionChange = this.handleCountryOptionChange.bind(this);
    this.handleSelectedCaseChange = this.handleSelectedCaseChange.bind(this);
  }


  componentDidMount() {

    let data = sessionStorage.getItem("covid19-data");
    if (data) { // if data exist use the data
      data = JSON.parse(data);
      this.setState({
        data: data
      })
    } else { // if data is not exist in session storage fetch the data from the server
      axios.get("/api/data")
        .then(({ data }) => {
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

          // construct the data for the Heatmap
          let tempData = {
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

          this.setState({
            data: tempData
          })

          // store data in session storage for later use
          sessionStorage.setItem("covid19-data", JSON.stringify(tempData));
        });
    }
  }

  handleSelectedCaseChange(value) {
    this.setState({
      SelectedCase: value
    })
  }

  handleCountryOptionChange(value) {
    // get the coord of the selected value
    let lng = 0;
    let lat = 0;

    for (let i = 0; i < CountryOtions.length; i++) {
      if (CountryOtions[i].name === value) {
        lng = CountryOtions[i].latlng[1]
        lat = CountryOtions[i].latlng[0]
        break;
      }
    }

    // set the state
    this.setState({
      selected: {
        map: {
          lat: lat,
          lng: lng,
          zoom: 5
        }
      },
      countryOption: value
    });
  }



  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Layout>
          <Sider>
            <h1 style={{ color: "white" }}>Country: </h1>
            <Select defaultValue={this.state.countryOption} style={{ width: 120 }} onChange={this.handleCountryOptionChange}>
              {CountryOtions.map((country) => {
                return <Option value={country.name}>{country.name}</Option>
              })}
            </Select>
            <h1 style={{ color: "white" }}>Case: </h1>
            <Select defaultValue={this.state.SelectedCase} style={{ width: 120 }} onChange={this.handleSelectedCaseChange}>
              {this.state.options.case.map((c) => {
                return <Option value={c}>{c}</Option>
              })}
            </Select>
          </Sider>
          <Layout>
            <Content>
              <Row gutter={[8, 8]}>
                <Col key="Heatmap" span={18}>
                  <HeatMap coordinates={this.state.data.map}
                    lat={this.state.selected.map.lat}
                    lng={this.state.selected.map.lng}
                    zoom={this.state.selected.map.zoom}
                  />
                </Col>
                <Col key="Country-Info" span={6}>
                  <CountryInfo
                    selectedCountry={this.state.countryOption}
                  />
                </Col>
              </Row>
              <Row gutter={[8, 8]}>
                <Col key="Selected-Country-Graph" span={18}>
                  <Graph
                    selectedCountry={this.state.countryOption}
                    selectedCase={this.state.SelectedCase} />
                </Col>
                <Col key="World-Info" span={6}>
                  <StatisticSummary
                    data={this.state.data.statistic} />
                </Col>
              </Row>

            </Content>
            <Footer>

            </Footer>
          </Layout>
        </Layout>
      </Layout>

    );
  }
}

export default App;
