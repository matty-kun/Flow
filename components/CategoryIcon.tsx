import React from 'react';
import { Image } from 'react-native';
import {
  Tag, Briefcase, Heart, BookOpen, Coffee as CoffeeIcon, Zap, Target,
  Brain, Users, Code, Music, Camera, Layers, Dumbbell, Flame, Globe,
  Home, Laptop, Leaf, MessageCircle, Moon, Palette, Pencil, Pizza,
  Plane, Rocket, Shield, ShoppingBag, Smile, Star, Sun, Tv, Watch,
  Wrench, Gamepad2, GraduationCap, Headphones, Map, MoreHorizontal,
  Activity, Anchor, Baby, Banana, Bath, Bell, Bike, Bird,
  Book, Box, Bus, Car, Cat, Church, Clapperboard, Clock, Cloud,
  Compass, Cookie, Crown, CupSoda, Diamond, Dog, Droplet, Egg,
  Eye, Fish, Flag, Flower, Gift, Guitar,
  Hammer, Handshake, Hospital, Hotel, House, Infinity,
  Joystick, Key, Lamp, Lightbulb, Lock, Medal, Microscope,
  Milestone, Mountain, Newspaper, Package, PawPrint, Phone,
  PiggyBank, Pin, Printer, Rainbow, Receipt, Scissors, Search,
  Send, Settings, Shirt, ShoppingCart, Siren, Sofa, Sprout,
  Stethoscope, Swords, Tent, Terminal, Ticket, Timer,
  Train, Trophy, Truck, Umbrella, University, Utensils, Video,
  Wallet, Wind, Wine, Workflow,
} from 'lucide-react-native';

const icons: Record<string, any> = {
  'briefcase': Briefcase, 'heart': Heart, 'book-open': BookOpen,
  'coffee': CoffeeIcon, 'zap': Zap, 'target': Target, 'brain': Brain,
  'tag': Tag, 'more-horizontal': MoreHorizontal, 'users': Users, 'code': Code, 'music': Music,
  'camera': Camera, 'layers': Layers, 'dumbbell': Dumbbell, 'flame': Flame,
  'globe': Globe, 'home': Home, 'laptop': Laptop, 'leaf': Leaf,
  'message-circle': MessageCircle, 'moon': Moon, 'palette': Palette,
  'pencil': Pencil, 'pizza': Pizza, 'plane': Plane, 'rocket': Rocket,
  'shield': Shield, 'shopping-bag': ShoppingBag, 'smile': Smile,
  'star': Star, 'sun': Sun, 'tv': Tv, 'watch': Watch, 'wrench': Wrench,
  'gamepad': Gamepad2, 'graduation-cap': GraduationCap,
  'headphones': Headphones, 'map': Map,
  'activity': Activity, 'anchor': Anchor, 'baby': Baby, 'banana': Banana,
  'bath': Bath, 'bell': Bell, 'bike': Bike, 'bird': Bird,
  'book': Book, 'box': Box, 'bus': Bus, 'car': Car, 'cat': Cat,
  'church': Church, 'clapperboard': Clapperboard, 'clock': Clock,
  'cloud': Cloud, 'compass': Compass, 'cookie': Cookie, 'crown': Crown,
  'cup': CupSoda, 'diamond': Diamond, 'dog': Dog, 'droplet': Droplet,
  'egg': Egg, 'eye': Eye, 'fish': Fish, 'flag': Flag, 'flower': Flower,
  'gift': Gift, 'guitar': Guitar,
  'hammer': Hammer, 'handshake': Handshake,
  'hospital': Hospital, 'hotel': Hotel, 'house': House,
  'infinity': Infinity, 'joystick': Joystick, 'key': Key, 'lamp': Lamp,
  'lightbulb': Lightbulb, 'lock': Lock, 'medal': Medal,
  'microscope': Microscope, 'milestone': Milestone, 'mountain': Mountain,
  'newspaper': Newspaper, 'package': Package, 'paw-print': PawPrint,
  'phone': Phone, 'piggy-bank': PiggyBank, 'pin': Pin, 'printer': Printer,
  'rainbow': Rainbow, 'receipt': Receipt, 'scissors': Scissors,
  'search': Search, 'send': Send, 'settings': Settings, 'shirt': Shirt,
  'shopping-cart': ShoppingCart, 'siren': Siren, 'sofa': Sofa,
  'sprout': Sprout, 'stethoscope': Stethoscope, 'swords': Swords,
  'tent': Tent, 'terminal': Terminal, 'ticket': Ticket, 'timer': Timer,
  'train': Train, 'trophy': Trophy, 'truck': Truck,
  'umbrella': Umbrella, 'university': University, 'utensils': Utensils,
  'video': Video, 'wallet': Wallet, 'wind': Wind, 'wine': Wine,
  'workflow': Workflow,
};

export const CategoryIcon = ({ name, size, color, customImageUri }: { name: string, size: number, color: string, customImageUri?: string }) => {
  if (customImageUri) {
    return <Image source={{ uri: customImageUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const IconComponent = icons[name] || Tag;
  return <IconComponent size={size} color={color} />;
};
