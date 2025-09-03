function initESRIMap() {
    require(["esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/widgets/Locate",
        "esri/widgets/Search",
        "esri/widgets/Search/SearchViewModel",
        "esri/layers/FeatureLayer"], function (
        esriConfig,
        Map,
        MapView,
        Locate,
        Search,
        SearchViewModel,
        FeatureLayer
    ) {

        esriConfig.apiKey = "AAPK8b2ce96b69e444f9a0c9b38b358f04b9bivwZBFW4IQqydIo2KdGsN0eXa9JEWxVF1HKv-O8D7CmONh-N7uZbPICvtZIoQtF";
        map = new Map({
            basemap: "arcgis-navigation" // Basemap layer service
        });

        const view = new MapView({
            map: map,
            center: [-117.21543787728649, 33.9269854906651], // Longitude, latitude
            zoom: 11, // Zoom level
            container: "map-div" // Div element
        });

        const locate = new Locate({
            view: view,
            useHeadingEnabled: false,
            goToOverride: function (view, options) {
            options.target.scale = 4500;
            return view.goTo(options.target);
            }
        });
        view.ui.add(locate, "top-left");

        const morenoAddressPointsLayer = new FeatureLayer({
            url: "https://mvrdalrt.moval.gov/arcgis/rest/services/AddressPoints/MapServer/0",
        });
    
        const morenoParcelLayer = new FeatureLayer({
            url: "https://mvrdalrt.moval.gov/arcgis/rest/services/ParcelService/FeatureServer/0",
            renderer: {
            type: "simple",
            symbol: {
                type: "simple-line",
                color: "#424242",
                size: .4,
            }
            }
        });
        map.add(morenoParcelLayer);

        const search = new Search({
            view: view,
            includeDefaultSources: false,
            locationEnabled: true,
            viewModel: new SearchViewModel({
            includeDefaultSources: false,
            maxSuggestions: 15,
            minSuggestCharacters: 3}),
            sources: [
            {
                layer: morenoAddressPointsLayer,
                name: "Addresses",
                searchFields: ["FULLADD"],
                suggestionTemplate: "{FULLADD}",
                placeholder: "Search by Address",
                outFields: "*",
            },
            {
                layer: morenoAddressPointsLayer,
                searchFields: ["APN"],
                suggestionTemplate: "{APN}",
                outFields: ["*"],
                name: "Parcel Numbers",
                placeholder: "Search by Parcel Number",
            },
            ]
        });
        view.ui.add(search, "top-right");

        view.on("click", function (evt) {
            parcelQuery(evt.mapPoint);
        });

        search.on("select-result", function (event) {
            var attributes = event.result.feature.attributes;
            var pt = {
            latitude: 0,
            longitude: 0,
            type: "point",
            }

            // Address Source
            if (event.sourceIndex == 0 || true) {
                var address = attributes.FULLADD;
                // console.dir(event);
                view.goTo({target: event.result.feature.geometry, zoom: 15}, {duration: 1000, easing: "ease-in-out"});
                view.popup.open({
                    title: "Address:",
                    content: address,
                    location: event.result.feature.geometry,
                });
                $("#selected_address").val(address);
                $("#selected_houseNo").val(attributes.HOUSE_NO);
                $("#selected_street").val(attributes.STREET);
                $("#selected_suffix").val(attributes.SUFFIX);
                $("#selected_city").val(attributes.CITY);
                $("#selected_zip").val(attributes.ZIP);
                $("#selected_parcel").val(attributes.APN);
                $("[href='#125']").removeClass("ztdisabled");
            // Parcel Source 
            } else if (event.sourceIndex == 1) {
            pt.latitude = parseFloat(event.result.feature.geometry.centroid.latitude);
            pt.longitude = parseFloat(event.result.feature.geometry.centroid.longitude);
            parcelQuery(pt);
            }
            $("[href='#125']").removeClass("ztdisabled");
        });

        async function parcelQuery(pPoint) {
            // Create query object and add lat/long
            // console.log("Querying Parcel Layer");
            // console.dir(pPoint);
            const parcelQuery = {
            geometry: pPoint,
            spatialRelationship: "intersects",
            outFields: ["*"],
            returnGeometry: true
            };

            // Query the Parcel layer using the lat/long from above
            const results = await morenoParcelLayer.queryFeatures(parcelQuery);
            // console.dir(results);
            if (results.features.length == 1) {
                var attributes = results.features[0].attributes;
                const geometry = results.features[0].geometry;
                view.goTo({target: geometry, zoom: 15}, {duration: 1000, easing: "ease-in-out"});
        
                var titleStr;
                var contentStr;
                var house_no = attributes.HOUSE_NO;
                var street = attributes.STREET;
                var suffix = attributes.SUFFIX;
                var city = attributes.CITY;
                var zip = attributes.ZIP;
                var apn = attributes.APN;
                
                if (zip == 0 || street == " ") {
                    titleStr = "Parcel:";
                    contentStr = apn;
                    $("#selected_address").val("N/A");
                } else {
                    titleStr = "Address:";
                    contentStr = house_no + " " + street + " " + suffix;
                }
                view.popup.open({
                    title: titleStr,
                    content: contentStr,
                    location: pPoint,
                });
                $("#selected_houseNo").val(house_no);
                $("#selected_street").val(street);
                $("#selected_suffix").val(suffix);
                $("#selected_city").val(city);
                $("#selected_zip").val(zip);
                $("#selected_parcel").val(attributes.APN);
                $("[href='#125']").removeClass("ztdisabled");
            }
        }
    });
}