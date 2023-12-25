import {  Feature, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import * as olProj from 'ol/proj';
import OSM from 'ol/source/OSM';
import '../App.scss';
import RaceTrack from '../raceTrack.json';
import FirstLap from '../lap1.json';
import SecondLap from '../lap2.json';
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Geometry, Point, Polygon } from "ol/geom";
import { Fill, Icon, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { useEffect, useRef } from "react";

import Car from '../fastRaceCar.svg';
import { receiveMessageOnPort } from "worker_threads";
import userEvent from "@testing-library/user-event";

interface MapComponentProps {
    lapInfo: {
        type: string;
        bbox: number[];
        features: {
            type: string;
            geometry: {
                type: string;
                coordinates: number[];
            };
            properties: {
                distance: string;
            };
        }[]; // Type this according to your data structure
  }|null
}



export default function MapComponent({ lapInfo }: MapComponentProps){

    const carStyle = new Style({
        image: new Icon({
            src: '../fastRaceCar.svg',
        })
    })

    const mapRef = useRef<Map|null>(null);
    const lapLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

    useEffect(() => {
        if(lapInfo !== null)
        {
            const lapData = lapInfo;

            const lapFeatures = lapData.features;

            const webMeractorCoordinatesFromData = lapFeatures.map(feature => {
                return olProj.transform(feature.geometry.coordinates,sourceProjection,targetProjection);
            })

            const lapVectorSourceData = new VectorSource();

            for(let i = 0; i<webMeractorCoordinatesFromData.length; i++){
                let lapPoint = new Point(webMeractorCoordinatesFromData[i]);
                let lapFeature = new Feature(lapPoint);
                lapVectorSourceData.addFeature(lapFeature);
            }

            const lapVectorLayerData = new VectorLayer({
                source: lapVectorSourceData,
                style: pointStyle,
                visible: true,
                zIndex: 4,
            })

            console.log("Vector layer created: ", lapVectorLayerData)

            if (mapRef.current) {
                // Remove the previous lap layer if it exists
                if (lapLayerRef.current) {
                    mapRef.current.removeLayer(lapLayerRef.current);
                }

                // Add the new lap layer
                mapRef.current.addLayer(lapVectorLayerData);
                lapLayerRef.current = lapVectorLayerData;
            }


        }

    }, [lapInfo]);

    const sourceProjection = 'EPSG:4326';

    const targetProjection = 'EPSG:3857';
  
  
  //Polygon styling
  const polygonStyle = new Style({
      fill: new Fill({
          color: 'rgba(120, 120, 120, 0.8)',
      }),
      stroke: new Stroke({
          color: 'rgba(255, 0, 0, 0.8)',
          width: 4,
      })
  })
  
  //Point styling
  const pointStyle = new Style({
      image: new CircleStyle({
          radius: 2,
          fill: new Fill({
              color: 'rgba(57, 106, 196, 0.8)',
          })
      }),
      stroke: new Stroke({
          color: 'rgba(57, 106, 196, 0.8)',
          width: 2,
      })
  })

  //Point styling 2
  const pointStyle2 = new Style({
    image: new CircleStyle({
        radius: 20,
        fill: new Fill({
            color: 'rgba(255, 0, 0, 0.8)',
        })
    }),
    stroke: new Stroke({
        color: 'rgba(255, 0, 0, 0.8)',
        width: 2,
    })
})
  
  //Creating race track on the map
  const jsonData = RaceTrack;
  
  const coordinatesFromJson = jsonData.features[0].geometry.coordinates;
  
  const webMercatorCoordinatesin3D = coordinatesFromJson.map(coord2D => {
      return coord2D.map(coord => {
          return olProj.transform(coord,sourceProjection,targetProjection);
      })
  })
  
  const polygon = new Polygon(webMercatorCoordinatesin3D);
  
  const polygonFeature = new Feature(polygon);
  
  const vectorSource = new VectorSource();
  vectorSource.addFeature(polygonFeature);
  
  const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: polygonStyle,
      visible: true,
      zIndex: 2
  });
  
  //Creating Lap Points

  useEffect(() => {
    if (!mapRef.current) {
        // Only create a new map if it doesn't exist
        const map = new Map({
            view: new View({
                center: webMercatorCoordinatesin3D[0][0],
                zoom: 16,
            }),
            layers: [
                new TileLayer({
                    source: new OSM(),
                    visible: true,
                    zIndex: 1,
                }),
                vectorLayer,
            ],
            target: 'MapContainer',
        });

        mapRef.current = map;
    }
}, [webMercatorCoordinatesin3D]);


  

  function handleRaceStart(){
    if (lapInfo && lapInfo.features.length > 0){
        const raceStartCoords = lapInfo.features[0].geometry.coordinates;
        const raceStartCoordsMercator = olProj.transform(raceStartCoords,sourceProjection,targetProjection);
        const raceStartPoint = new Point(raceStartCoordsMercator);
        const raceStartFeature = new Feature(raceStartPoint);
        const raceStartVectorSource = new VectorSource();
        raceStartVectorSource.addFeature(raceStartFeature);
        const raceStartVectorLayer = new VectorLayer({
            source: raceStartVectorSource,
            style: pointStyle2,
            visible: true,
            zIndex: 7
        })
    
        if(mapRef.current){
            mapRef.current.getLayers().forEach((layer) => {
                if(layer instanceof VectorLayer && layer.getZIndex() === 7){
                    if(mapRef.current){
                        mapRef.current.removeLayer(layer);
                    }
                }
            })
    
        mapRef.current.addLayer(raceStartVectorLayer)
        }
    }
    
  }
      

    return(
        <div id="wrapper">
            <button onClick={handleRaceStart}>Race</button>
        <div id="MapContainer"></div>
        </div>
        
    );
}