import {  Feature, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import * as olProj from 'ol/proj';
import OSM from 'ol/source/OSM';
import '../App.scss';
import RaceTrack from '../raceTrack.json';
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Geometry, Point, Polygon } from "ol/geom";
import { Fill, Icon, IconImage, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { fromExtent } from "ol/geom/Polygon";

import iconForPoint from "./exoscale.svg";

const imgPath = '../fastRaceCar.svg';


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

  //Point styling
  const pointStyle2 = new Style({
    image: new CircleStyle({
        radius: 5,
        fill: new Fill({
            color: 'rgba(255, 0, 0, 1)',
        })
    }),
    stroke: new Stroke({
        color: 'rgba(255, 255, 0, 1)',
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


function calcAzimuth(lat1: number, lon1: number, lat2: number, lon2: number): number{
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let azimuth = Math.atan2(y, x);
    azimuth = (azimuth * 180) / Math.PI;

    azimuth = (azimuth + 360) % 360;

    return azimuth;
}


  const [intervalId, setIntervalId] = useState<number | NodeJS.Timer | null>(null);
  const [counter, setCounter] = useState<number>(0);

  const intervalFunction = () => {
    if(lapInfo){
        setCounter((prevCounter) => prevCounter + 1);
    }
    

  };

  useEffect(() => {
    if (lapInfo && lapInfo.features.length > 0 && counter<lapInfo.features.length - 1){
        const raceStartCoords = lapInfo.features[counter].geometry.coordinates;
        const raceStartCoordsMercator = olProj.transform(raceStartCoords,sourceProjection,targetProjection);
        const raceStartPoint = new Point(raceStartCoordsMercator);
        const raceStartFeature = new Feature(raceStartPoint);
        const raceStartVectorSource = new VectorSource();
        raceStartVectorSource.addFeature(raceStartFeature);


        const azimuth = calcAzimuth(lapInfo.features[counter].geometry.coordinates[1],lapInfo.features[counter].geometry.coordinates[0],lapInfo.features[counter+1].geometry.coordinates[1],lapInfo.features[counter+1].geometry.coordinates[0])

        const track = RaceTrack;

        const polygonCoordinates = track.features[0].geometry.coordinates;

        const polygonGeometry = new Polygon(polygonCoordinates);

        const pointCoordinates = lapInfo.features[counter].geometry.coordinates;

        const isInside = polygonGeometry.intersectsCoordinate(pointCoordinates);

        if(!isInside){
            const currentDate = new Date();
            const currentTime = currentDate.toLocaleTimeString();
            console.log("Car is out of the racetrack. Coordinates: ", lapInfo.features[counter].geometry.coordinates[1], " ", lapInfo.features[counter].geometry.coordinates[0], "Current time: ", currentTime);
        }

        const iconStyle = new Style({
            image: new Icon({
                src: iconForPoint,
                scale: 0.15,
                rotation: (azimuth * Math.PI) / 180,
                rotateWithView: true
            })
        })
        const raceStartVectorLayer = new VectorLayer({
            source: raceStartVectorSource,
            style: iconStyle,
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
  }, [counter])

  const startInterval = () => {
    if(!intervalId){
        const newIntervalId = setInterval(intervalFunction, parseInt(textboxValue));
        setIntervalId(newIntervalId);
    }
  };

  const stopInterval = () => {
    clearInterval(intervalId as NodeJS.Timer);
    setIntervalId(null);
  }

  useEffect(() => {
    return () => {
        if(intervalId){
            clearInterval(intervalId);
        }
    };
  }, [intervalId])
      
const [textboxValue, setTextboxValue] = useState<string>('');

const handleTextboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(/\D/g, '');
    setTextboxValue(newValue);
}

    return(
        <div id="wrapper">
            <p>Select delay of racing animation in ms and press Start to begin</p>
            <input type="text" pattern="[0-9]" onChange={handleTextboxChange}/>
            <button onClick={startInterval}>Start</button>
            <button onClick={stopInterval}>Stop</button>
        <div id="MapContainer"></div>
        </div>
        
    );
}