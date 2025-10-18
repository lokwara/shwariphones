"use client";

import { useEffect, useState } from "react";
// import { Marker, useMapEvents } from "react-leaflet";
import Leaflet from "leaflet";
import * as ReactLeaflet from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

const { MapContainer } = ReactLeaflet;

const Map = ({ children, getPosition, ...rest }) => {
  const [position, setPosition] = useState();

  useEffect(() => {
    (async function init() {
      delete Leaflet.Icon.Default.prototype._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "leaflet/images/marker-icon.png",
        iconUrl: "leaflet/images/marker-icon.png",
        shadowUrl: "leaflet/images/marker-shadow.png",
      });
    })();
  }, []);

  const LocationMarker = () => {
    ReactLeaflet.useMapEvents({
      click(e) {
        setPosition(e.latlng);
        getPosition(e.latlng); // Get latitude and longitude on click
      },
    });

    return position ? (
      <ReactLeaflet.Marker position={position}></ReactLeaflet.Marker>
    ) : null; // Render marker if position is selected
  };

  return (
    <MapContainer style={{ height: "300px", width: "100%" }} {...rest}>
      <>
        <ReactLeaflet.TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </>
    </MapContainer>
  );
};

export default Map;
