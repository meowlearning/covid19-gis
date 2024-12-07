import React, { Component } from 'react';
import HeatMap from './components/HeatMap';
import Graph from './components/Graph';
import StatisticSummary from './components/Statistic';
import RegionInfo from './components/RegionInfo';
import { Layout, Row, Col, Tabs, Menu, Card } from 'antd';
import './App.css';
import CustomTooltip from './components/CustomTooltip';
const axios = require("axios").default;
const { Header, Footer, Content } = Layout;
const { TabPane } = Tabs;


class App extends Component {

  state = {
    info: "Region Selector",
    statistic: null,
    countries: [],
    states: [],
    counties: [],
    map: {
      lat: 0,
      lng: 0,
      zoom: 0
    },
    SelectedCountry: "Global",
    SelectedState: "",
    SelectedCounty: "",
    gis: [],
    regionInfo: {},
    graphData: {},
    activeKey: "country"
  }

  constructor() {
    super();
    this.handleCountryOptionChange = this.handleCountryOptionChange.bind(this);
    this.getGISData = this.getGISData.bind(this);
    this.getRegions = this.getRegions.bind(this);
    this.getRegionInfo = this.getRegionInfo.bind(this);
    this.handleStateOptionChange = this.handleStateOptionChange.bind(this);
    this.handleCountyOptionChange = this.handleCountyOptionChange.bind(this);
    this.handleGPSClick = this.handleGPSClick.bind(this);
    this.setTabKey = this.setTabKey.bind(this);
  }


  getGISData() {
    // get gis data and update state
    axios.get('/api/gis')
      .then(async ({ data: {result} }) => {
        // construct the data for the Heatmap
        this.setState({
          gis: result
        })
      })
      .catch(err => console.error(err))
  }

  /**
   * This will get the regions based on given context.
   * if country is not defined return every countries
   * if country is defined and state is not defined return all states of given country
   * if country and state is defined return all counties of given country and state
   * @param {String} country specify this to get states
   * @param {String} state specify this and country to get counties
   * @returns {Promise} Promise resolves into an array of regions and their locations
   */
  getRegions(country, state) {
    country = country === undefined ? '' : country;
    state = state === undefined ? '' : state;

    return axios.get(`/api/regions?country=${country}&state=${state}`)
  }

  getRegionInfo(country, state, county) {
    country = (country === undefined || country === 'Global') ? '' : country;
    state = state === undefined ? '' : state;
    county = county === undefined ? '' : county;

    return axios.get(`/api/graphinfo?country=${country}&state=${state}&county=${county}`)
  }

  componentDidMount() {
    this.getGISData();

    // get countries
    this.getRegions()
        .then(async ({ data: {result} }) => {

          result.unshift({
            _id: {
              country: 'Global'
            },
            lat: 0,
            lng: 0
          })

          // set countries
          this.setState({
            countries: result,
          })
        })
        .catch(err => console.error(err))

    // setup global info and global's graph
    this.setState({
      regionInfo: null,
      graphData: null,
    })

    this.getRegionInfo()
      .then(({ data: {result} }) => {
        // set up graph and info
        this.setState({
          graphData: result,
          regionInfo: result[result.length - 1],
        })
      })
      .catch(err => console.error(err))
  }

  handleCountryOptionChange(value) {
    // get the country
    let country = value.key;

    // get location of country
    const loc = this.state.countries.find(({ _id }) => _id.country === country);

    // nullify region info, graph data, states and counties
    // set selected countries and location
    this.setState({
      regionInfo: null,
      graphData: null,
      states: [],
      counties: [],
      SelectedState: "",
      SelectedCounty: "",
      SelectedCountry: country,
      map: {
        lat: loc.lat,
        lng: loc.lng,
        zoom: 5
      }
    })

    // update states list
    this.getRegions(country)
      .then(({ data: {result} }) => {
        // set states
        this.setState({
          states: result
        })
      })
      .catch(err => console.error(err))

    // get country info and graph info
    this.getRegionInfo(country)
      .then(({ data: {result} }) => {
        this.setState({
          graphData: result,
          regionInfo: result[result.length - 1]
        })
      })
      .catch(err => console.error(err))
  }

  handleStateOptionChange(value) {
    //  get the state
    let state = value.key;

    // get location of the state
    const loc = this.state.states.find(({ _id }) => _id.state === state);

    // nullify graph data, region info, counties, set selected state and location
    this.setState({
      regionInfo: null,
      graphData: null,
      counties: [],
      SelectedCounty: "",
      SelectedState: state,
      map: {
        lat: loc.lat,
        lng: loc.lng
      }
    })

    // get all counties for the counties list
    this.getRegions(this.state.SelectedCountry, state)
      .then(({ data: {result} }) => {
        // set the counties
        this.setState({
          counties: result
        })
      })
      .catch(err => console.error(err))

    // get state's graphinfo
    this.getRegionInfo(this.state.SelectedCountry, state)
      .then(({ data: {result} }) => {
        this.setState({
          graphData: result,
          regionInfo: result[result.length - 1]
        })
      })
      .catch(err => console.error(err))
  }

  handleCountyOptionChange(value) {
    // get the county's name
    let county = value.key;

    // get location of county
    const loc = this.state.counties.find(({ _id }) => _id.county === county);


    // nullify graph data and info, set selected county and location
    this.setState({
      regionInfo: null,
      graphData: null,
      SelectedCounty: county,
      map: {
        lat: loc.lat,
        lng: loc.lng,
        zoom: 5
      }
    })

    // get county's graphinfo
    this.getRegionInfo(this.state.SelectedCountry, this.state.SelectedState, county)
      .then(({ data: {result} }) => {
        this.setState({
          graphData: result,
          regionInfo: result[result.length - 1]
        })
      })
      .catch(err => console.error(err))
  }

  handleGPSClick(GPSData) {
    // nullify region info, graph data, states and counties
    // selected countries and location
    this.setState({
      regionInfo: null,
      graphData: null,
      states: [],
      counties: [],
      SelectedCountry: "",
      SelectedState: "",
      SelectedCounty: "",
    })

    // try get get until county level then back up to state and finally country
    this.getRegionInfo(GPSData.country, GPSData.state, GPSData.county)
      .then(({ data: {result} }) => {
        if (result.length !== 0) {
          this.setState({
            SelectedCountry: GPSData.country,
            SelectedState: GPSData.state,
            SelectedCounty: GPSData.county,
            graphData: result,
            regionInfo: result[result.length - 1],
            map: {
              lat: GPSData.lat,
              lng: GPSData.lng,
              zoom: GPSData.zoom
            },
            activeKey: "country"
          })
          return true;
        }
      })
      .then(gotData => {
        if (!gotData) {
          // try to get state level
          return this.getRegionInfo(GPSData.country, GPSData.state)
        }
      })
      .then((data) => {
        if (data) {
          let {data: {result}} = data;
          if (result.length !== 0) {
            this.setState({
              SelectedCountry: GPSData.country,
              SelectedState: GPSData.state,
              graphData: result,
              regionInfo: result[result.length - 1],
              map: {
                lat: GPSData.lat,
                lng: GPSData.lng,
                zoom: GPSData.zoom
              },
              activeKey: "country"
            })
            return true;
          }
        }
      })
      .then(gotData => {
        if (!gotData) {
          // try to get country level
          return this.getRegionInfo(GPSData.country)
        }
      })
      .then((data) => {
        if (data) {
          let {data: {result}} = data;
          this.setState({
            SelectedCountry: GPSData.country,
            graphData: result,
            regionInfo: result[result.length - 1],
            map: {
              lat: GPSData.lat,
              lng: GPSData.lng,
              zoom: GPSData.zoom
            },
            activeKey: "country"
          })
        }
      })
      .catch(err => console.error(err))
  }

  setTabKey = activeKey => {
    this.setState({ activeKey }, () => console.log(this.state.activeKey))
  }

  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Layout>
          <Content
          >
            <Row
              gutter={[8, 8]}
            >
              {/** Region Selection */}
              <Col flex="1 0 25%">
                <Card
                  title={`Region Selection`}
                  extra={<CustomTooltip info={this.state.info} />}
                >
                  <Tabs
                    type="card"
                    onChange={this.setTabKey}
                    activeKey={this.state.activeKey}
                    style={{
                      height: "121vh"
                    }}
                  >
                    <TabPane
                      tab="Country"
                      key="country"
                      style={{
                        overflow: 'auto',
                        position: 'relative',
                        height: "121vh"
                      }}
                    >
                      <Menu
                        mode="inline"
                        defaultSelectedKeys={["Global"]}
                        onClick={this.handleCountryOptionChange}
                      >
                        {
                          this.state.countries.map(c => {
                            return <Menu.Item key={c._id.country}>{c._id.country}</Menu.Item>
                          })
                        }
                      </Menu>
                    </TabPane>
                    <TabPane
                      disabled={!this.state.states.length}
                      tab="State"
                      key="state"
                      style={{
                        overflow: 'auto',
                        position: 'relative',
                        height: "121vh"
                      }}
                    >
                      <Menu
                        mode="inline"
                        onClick={this.handleStateOptionChange}
                      >
                        {
                          this.state.states.map(c => {
                            return <Menu.Item key={c._id.state}>{c._id.state}</Menu.Item>
                          })
                        }
                      </Menu>
                    </TabPane>
                    <TabPane
                      disabled={!this.state.counties.length}
                      tab="County"
                      key="county"
                      style={{
                        overflow: 'auto',
                        position: 'relative',
                        height: "121vh"
                      }}
                    >
                      <Menu
                        mode="inline"
                        onClick={this.handleCountyOptionChange}
                      >
                        {
                          this.state.counties.map(c => {
                            return <Menu.Item key={c._id.county}>{c._id.county}</Menu.Item>
                          })
                        }
                      </Menu>
                    </TabPane>
                  </Tabs>
                </Card>
              </Col>
              {/** Content */}
              <Col flex="1 0 50%">
                <Row gutter={[8, 8]}>
                  <Col key="Heatmap" span={24}>
                    <HeatMap
                      gis={this.state.gis}
                      lat={this.state.map.lat}
                      lng={this.state.map.lng}
                      zoom={this.state.map.zoom}
                      handleGPSClick={this.handleGPSClick}
                    />
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col key="Selected-Region-Graph" span={24}>
                    <Graph
                      data={this.state.graphData}
                    />
                  </Col>
                </Row>
              </Col>
              <Col flex="1 0 25%">
                <Row gutter={[8, 8]}>
                  <Col key="Region-Info" span={24}>
                    <RegionInfo
                      data={this.state.regionInfo}
                      country={this.state.SelectedCountry}
                      state={this.state.SelectedState}
                      county={this.state.SelectedCounty}
                    />
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col key="Region-Statistic" span={24}>
                    <StatisticSummary
                      data={this.state.regionInfo} />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Content>
        </Layout >
        <Footer style={{ textAlign: "center" }}>Data taken from MongoDB -- MeowLearning © 2020</Footer>
      </Layout >

    );
  }
}

export default App;
