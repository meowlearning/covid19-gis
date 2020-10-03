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
const tinygradient = require('tinygradient');

class App extends Component {

  state = {
    statistic: null,
    map: null,
    countries: [],
    selected: {
      map: {
        lat: 0,
        lng: 0,
        zoom: 0
      },
    },
    SelectedCase: "Confirmed",
    SelectedCountry: "Global",
    options: {
      case: ["Confirmed", "Deaths", "Recovered"]
    }
  }

  constructor() {
    super();
    this.handleCountryOptionChange = this.handleCountryOptionChange.bind(this);
    this.handleSelectedCaseChange = this.handleSelectedCaseChange.bind(this);
    this.getGISData = this.getGISData.bind(this);
    this.getGlobalInfo = this.getGlobalInfo.bind(this);
    this.getCountries = this.getCountries.bind(this);
  }


  getGISData(selectedCase) {
    let colors = null;
    let gradient = null;
    if (selectedCase == "Confirmed") {
      gradient = tinygradient([
        "#00ffef",
        "#0480f7",
        "#0800ff",
      ]);
      colors = gradient.rgb(20).map(t => t.toHexString());
    } else if (selectedCase == "Deaths") {
      gradient = tinygradient([
        "#caff00",
        "#f78204",
        "#ff0000",
      ])
      colors = gradient.rgb(20).map(t => t.toHexString());
    } else if (selectedCase == "Recovered") {
      gradient = tinygradient([
        "#e6ff70",
        "#75ff70",
        "#00ff6f"
      ])
      colors = gradient.rgb(20).map(t => t.toHexString());
    }

    colors.unshift("rgba(0, 0, 0, 0)");

    // get gis data and update state
    axios.get('/api/gis')
      .then(async ({ data }) => {
        console.log(data)
        let result = data.result;
        let positions_and_intensity = [];

        positions_and_intensity = result.map((d) => (
          {
            lat: d.coords[1],
            lng: d.coords[0],
            weight: d[selectedCase.toLowerCase()] || 0
          }
        ))

        console.log(positions_and_intensity);

        // construct the data for the Heatmap
        this.setState({
          map: {
            positions: positions_and_intensity,
            options: {
              radius: 15,
              maxIntensity: 10000,
              gradient: colors,
            }
          }
        })
      })
      .catch(err => console.log(err))
  }

  getGlobalInfo() {
    axios.get('/api/globalinfo')
      .then(async ({ data }) => {
        // construct the data for the statistic
        let statistic = {
          confirmed: data.confirmed,
          deaths: data.deaths,
          recovered: data.recovered,
          active: data.active,
          incidence: data.incidence
        }

        this.setState({
          statistic: statistic
        })

        // store data in session storage for later use
        sessionStorage.setItem("covid19-statistic", JSON.stringify(statistic));
      })
      .catch(err => console.log(err))
  }

  getCountries() {
    axios.get('/api/regions')
      .then(async ({ data }) => {

        // set countries
        this.setState({
          countries: data.result
        })

        // store data in session storage for later use
        sessionStorage.setItem("countries", JSON.stringify(data.result))
      })
      .catch(err => console.log(err))
  }

  componentDidMount() {

    let statistic = sessionStorage.getItem("covid19-statistic");
    if (statistic) { // if data statistic exist use the data
      statistic = JSON.parse(statistic);
      this.setState({
        statistic: statistic
      })
    } else { // if data statistic does not exist in session storage fetch the data from the server
      this.getGlobalInfo();
    }

    this.getGISData(this.state.SelectedCase);

    // get countries
    let countries = sessionStorage.getItem("countries");
    if (countries) {
      countries = JSON.parse(countries);
      this.setState({
        countries: countries
      })
    } else {
      this.getCountries();
    }
  }

  handleSelectedCaseChange(value) {
    this.getGISData(value);
    this.setState({
      SelectedCase: value
    })
  }

  handleCountryOptionChange(value) {
      const data = this.state.countries.find(({ _id }) => _id.country == value);

      this.setState({
        selected: {
          map: {
            lat: data.lat,
            lng: data.lng,
            zoom: 5,
          }
        },
        countryOption: value
      })
  }


  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Layout>
          <Sider>
            <Row gutter={[8, 24]}>
              <Col key="Country-Selection" span={6}>
                <h1 style={{ color: "white" }}>Country: </h1>
                <Select defaultValue={this.state.SelectedCountry} style={{ width: 150 }} onChange={this.handleCountryOptionChange}>
                  {this.state.countries.map((country) => {
                    return <Option value={country._id.country}>{country._id.country}</Option>
                  })}
                </Select>
              </Col>
            </Row>
            <Row gutter={[8, 24]}>
              <Col key="Case-Selection" span={6}>
                <h1 style={{ color: "white" }}>Case: </h1>
                <Select defaultValue={this.state.SelectedCase} style={{ width: 150 }} onChange={this.handleSelectedCaseChange}>
                  {this.state.options.case.map((c) => {
                    return <Option value={c}>{c}</Option>
                  })}
                </Select>
              </Col>
            </Row>


          </Sider>
          <Layout>
            <Content>
              <Row gutter={[8, 8]}>
                <Col key="Heatmap" span={18}>
                  <HeatMap coordinates={this.state.map}
                    lat={this.state.selected.map.lat}
                    lng={this.state.selected.map.lng}
                    zoom={this.state.selected.map.zoom}
                  />
                </Col>
                <Col key="Country-Info" span={6}>
                  <CountryInfo
                    selectedCountry={this.state.SelectedCountry}
                  />
                </Col>
              </Row>
              <Row gutter={[8, 8]}>
                <Col key="Selected-Country-Graph" span={18}>
                  <Graph
                    selectedCountry={this.state.SelectedCountry}
                    selectedCase={this.state.SelectedCase} />
                </Col>
                <Col key="World-Info" span={6}>
                  <StatisticSummary
                    data={this.state.statistic} />
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
