$(document).ready(function(){
    
    //model object
    let ListData = function(data){
        let self = this;
        self.id = ko.observable(data.id);
        self.name = ko.observable(data.name);
        self.lat = ko.observable(data.location.lat);
        self.lng = ko.observable(data.location.lng);
        self.address = ko.observable(data.location.address || data.location.formattedAddress);
        self.coords = ko.computed(function(){
            return {lat: self.lat(), lng: self.lng()};
        });

        self.marker = new google.maps.Marker({
            position: {lat: self.lat(), lng: self.lng()},
            title: self.name(),
            map: map,
            animation: google.maps.Animation.DROP
        });

        bounds.extend(self.marker.position);
    }

    //VM
    let ViewModel = function() {
        let self = this;

        self.listItems = ko.observableArray([]);

        self.itemToAdd = ko.observable("");

        self.search = function(){
            let search = self.itemToAdd();
            let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&limit=20&near=${search}`
            self.foursquareSearch(url);
        }

        self.clearList = function() {
            //remvoe markers
            self.listItems().forEach(function(item){
                item.marker.setMap(null);
            });
            //reset bounds

            //remove item from list
            self.listItems.removeAll();
        }

        self.hasItem = ko.computed(function(){
            return (self.itemToAdd());
        });

        self.isNotEmpty = ko.computed(function(){
            return (self.listItems().length);
        })

        self.removeItem = function(item){
            //marker
            item.marker.setMap(null);
            //item
            self.listItems.remove(item);
            
        }

        self.currentLocationSearch = function(){
            navigator.geolocation.getCurrentPosition(function(position){
                let ll = `${position.coords.latitude},${position.coords.longitude}`
                let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&limit=20&ll=${ll}`
                self.foursquareSearch(url);
            });
        }

        self.foursquareSearch = function(url){
            fetch(url).then(function(response){
                return response.json();
            }).then(function(data){
                self.clearList();
                data.response.venues.forEach(function(venue){
                    let venueObj = new ListData(venue)
                    self.listItems.push(venueObj);
                    map.fitBounds(bounds);
                    //clear list after search
                    self.itemToAdd(null);
                });
            }).catch(function(){
                $(".list-view").html("<li>Not Found</li>");
                console.log("Error fetching request");
            });
        }

    } 

    //ko apply bindings
    ko.applyBindings(new ViewModel());

});

