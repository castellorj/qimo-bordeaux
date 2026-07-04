import {
  CalendarDays, Map, Landmark, Grape, Sparkles, Wine, UtensilsCrossed, Utensils,
  ShoppingBag, Bell, Info, FileText, Heart, Home, MessageCircle, Phone, Siren,
  Ambulance, Shield, Cross, Car, Coins, Languages, Search, Menu, X, Sun, Moon,
  ChevronRight, ChevronDown, ChevronLeft, MapPin, Clock, ArrowRight, ArrowLeft,
  ArrowUpRight, Anchor, Ship, Shirt, Users, Star, Instagram, Globe, Download,
  QrCode, Plus, Minus, Check, Compass, Camera, Sunrise, Sunset, Thermometer,
  CloudRain, Wind, Wallet, ShieldCheck, Ticket, Bike, Music, Palette,
  BookOpen, Martini, Fish, Beef, ExternalLink, Navigation, Coffee, BedDouble, Mail,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  CalendarDays, Map, Landmark, Grape, Sparkles, Wine, UtensilsCrossed, Utensils,
  ShoppingBag, Bell, Info, FileText, Heart, Home, MessageCircle, Phone, Siren,
  Ambulance, Shield, Cross, Car, Coins, Languages, Search, Menu, X, Sun, Moon,
  ChevronRight, ChevronDown, ChevronLeft, MapPin, Clock, ArrowRight, ArrowLeft,
  ArrowUpRight, Anchor, Ship, Shirt, Users, Star, Instagram, Globe, Download,
  QrCode, Plus, Minus, Check, Compass, Camera, Sunrise, Sunset, Thermometer,
  CloudRain, Wind, Wallet, ShieldCheck, Ticket, Bike, Music, Palette,
  BookOpen, Martini, Fish, Beef, ExternalLink, Navigation, Coffee, BedDouble, Mail,
};

export function Icon({
  name,
  className,
  size = 18,
  strokeWidth = 1.5,
}: {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Cmp = map[name] ?? Sparkles;
  return <Cmp className={className} size={size} strokeWidth={strokeWidth} />;
}
