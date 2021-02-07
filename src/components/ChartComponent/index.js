import React, {useEffect} from 'react'
import Datafeed from './api2/datafeed.js'
import './index.css';
const ChartComponent = (props) => {

    useEffect(() => {
        const widgetOptions = {
			debug: true,
			symbol: props.symbol,
			datafeed: Datafeed,
			interval: props.interval,
			container_id: props.containerId,
			library_path: props.libraryPath,
			locale: 'en',
			disabled_features: ['use_localstorage_for_settings'],
			enabled_features: ['study_templates'],
			charts_storage_url: props.chartsStorageUrl,
			charts_storage_api_version: props.chartsStorageApiVersion,
			client_id: props.clientId,
			user_id: props.userId,
			fullscreen: props.fullscreen,
			autosize: props.autosize,
			studies_overrides: props.studiesOverrides,
			overrides: {
				"mainSeriesProperties.showCountdown": true,
				"paneProperties.background": "#131722",
				"paneProperties.vertGridProperties.color": "#363c4e",
				"paneProperties.horzGridProperties.color": "#363c4e",
				"symbolWatermarkProperties.transparency": 90,
				"scalesProperties.textColor" : "#AAA",
				"mainSeriesProperties.candleStyle.wickUpColor": '#336854',
				"mainSeriesProperties.candleStyle.wickDownColor": '#7f323f',
			}
		};

		const widget = (window.tvWidget = new window.TradingView.widget(
			widgetOptions
		));
	
		widget.onChartReady(() => {
		console.log("Chart has loaded!");
		});
    }, [])
    
    return (
        <div
			className="chartContainer"
            id={props.containerId}
        />
    )
}
ChartComponent.defaultProps = {
	symbol: 'Coinbase:BTC/USD',
	interval: '1D',
	containerId: 'tv_chart_container',
	libraryPath: '/charting_library/',
	chartsStorageUrl: 'https://saveload.tradingview.com',
	chartsStorageApiVersion: '1.1',
	clientId: 'tradingview.com',
	userId: 'public_user_id',
	fullscreen: false,
	autosize: true,
	studiesOverrides: {},
};
export default ChartComponent