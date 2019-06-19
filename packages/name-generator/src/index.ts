const names = [
    'ATMs', 'Anchor', 'Antechamber', 'Aquarium',
    'Archives', 'Armory', 'Attic', 'BBQ',
    'Backyard', 'Bakery', 'Balcony', 'Bar',
    'Barn', 'Barnyard', 'Bathroom', 'Bedroom',
    'Boulevard', 'Brewery', 'Bridge', 'Bunk',
    'Bunker', 'Cabin', 'Cabinet', 'Cafe',
    'Cafeteria', 'Campfire', 'Camping', 'Cantina',
    'Casino', 'Caterer', 'Chapel', 'Church',
    'Classroom', 'Clearance', 'Cliffside', 'Closet',
    'Cockpit', 'Container', 'Courtyard', 'Crypt',
    'Depot', 'Detention', 'Dormitory', 'Dorms',
    'Driveway', 'Dumpster', 'Elevator', 'Elevators',
    'Engine', 'Exhibition', 'Farmlands', 'Festival',
    'Fountain', 'Foyer', 'Gallery', 'Garage',
    'Garden', 'Gardens', 'Gargoyle', 'Garrage',
    'Gazeebo', 'Greenhouse', 'Gym', 'Hallway',
    'Hammam', 'Helipad', 'Infirmary', 'Jacuzzi',
    'Junkyard', 'Karaoke', 'Kennels', 'Kitchen',
    'Lakeside', 'Landing', 'Laundry', 'Library',
    'Lobby', 'Lockers', 'Lockgate', 'Lounge',
    'Market', 'Mezzanine', 'Mudroom', 'Museum',
    'Office', 'Palms', 'Pantry', 'Park',
    'Parking', 'Patio', 'Penthouse', 'Pergola',
    'Pipes', 'Plaza', 'Pool', 'Radio',
    'Reception', 'Restaurant', 'Roundabout', 'Sailboats',
    'Sewer', 'Shop', 'Showers', 'Snowmobiles',
    'Stable', 'Storage', 'Street', 'Study',
    'Submarine', 'Taiko', 'Teacups', 'Tellers',
    'Terrace', 'Theater', 'Tower', 'Valley',
    'Vault', 'Ventilation', 'Veranda', 'Village',
    'Walk-in', 'Walkway', 'Warehouse', 'Washrooms',
    'Workshop', 'Zodiac',
];

export default class NameGen {
    public names: string[];

    constructor() {
        this.names = names.sort(() => Math.random() - 0.5);
    }

    public next() {
        const name = this.names.shift();
        this.names.push(name);
        return name;
    }
}
