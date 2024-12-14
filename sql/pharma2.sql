-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (arm64)
--
-- Host: localhost    Database: pharmacy_management
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Pain Relief','Medicines for pain management and relief'),(2,'Antibiotics','Medicines for treating bacterial infections'),(3,'Allergy','Medicines for allergy relief'),(4,'Cough & Cold','Medicines for treating cough and cold symptoms'),(5,'Digestive Health','Medicines for digestive health support'),(6,'Heart & Blood Pressure','Medicines for heart and blood pressure management'),(7,'Diabetes','Medicines for managing diabetes'),(8,'Skin Care','Medicines and products for skin care'),(9,'Vitamins & Supplements','Vitamin and dietary supplements'),(10,'First Aid','Products for first aid and emergency care');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Customers`
--

DROP TABLE IF EXISTS `Customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customers`
--

LOCK TABLES `Customers` WRITE;
/*!40000 ALTER TABLE `Customers` DISABLE KEYS */;
INSERT INTO `Customers` VALUES (1,'Jane','0123','ex@gmail.com'),(2,'John','4567','ex@gmail.com');
/*!40000 ALTER TABLE `Customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int DEFAULT NULL,
  `medicine_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `invoice_items_ibfk_29` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invoice_items_ibfk_30` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (7,3,1,5,8.50),(8,3,2,3,7.00),(10,4,5,5,10.00),(11,4,2,3,7.00),(12,5,3,5,12.00),(13,5,9,3,15.00);
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_date` datetime NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `type` enum('sale','purchase') NOT NULL,
  `customer_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `fk_invoices_customers` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (3,'2024-12-15 12:00:00',63.50,'sale',1),(4,'2024-12-15 12:00:00',71.00,'sale',NULL),(5,'2024-12-15 12:00:00',105.00,'sale',2);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Shelf 1','Pain Relief, First Aid, Antibiotics'),(2,'Shelf 2','Allergy, Cough & Cold, Digestive Health'),(3,'Shelf 3','Diabetes'),(4,'Shelf 4','Heart & Blood Pressure'),(5,'Shelf 5','Skin Care, Vitamins & Supplements');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicines`
--

DROP TABLE IF EXISTS `medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category_id` int NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `supplier_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `expiry_date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `medicines_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `medicines_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES (1,'Acetaminophen',1,'Pain relief and fever reducer',8.50,0,1,1,'images/acetaminophen.jpg','2024-05-30 00:00:00'),(2,'Aspirin',1,'Pain relief and anti-inflammatory',7.00,10,2,1,'images/aspirin.jpg','2024-08-15 00:00:00'),(3,'Amoxicillin',2,'Antibiotic for bacterial infections',12.00,80,1,1,'images/amoxicillin.jpg','2024-03-25 00:00:00'),(4,'Azithromycin',2,'Broad-spectrum antibiotic',18.00,50,2,1,'images/azithromycin.jpg','2023-12-01 00:00:00'),(5,'Cetirizine',3,'Antihistamine for allergy relief',10.00,150,1,2,'images/cetirizine.jpg','2025-01-10 00:00:00'),(6,'Loratadine',3,'Allergy relief for sneezing and runny nose',11.50,130,2,2,'images/loratadine.jpg','2024-07-20 00:00:00'),(7,'Guaifenesin',4,'Expectorant for cough relief',9.00,70,1,2,'images/guaifenesin.jpg','2024-10-05 00:00:00'),(8,'Dextromethorphan',4,'Cough suppressant for dry cough',8.00,90,2,2,'images/dextromethorphan.jpg','2025-02-18 00:00:00'),(9,'Omeprazole',5,'For treating acid reflux and GERD',15.00,110,1,2,'images/omeprazole.jpg','2024-11-23 00:00:00'),(10,'Ranitidine',5,'Antacid for stomach acidity and ulcers',12.00,95,2,2,'images/ranitidine.jpg','2024-09-12 00:00:00'),(11,'Amlodipine',6,'Medication for high blood pressure',20.00,85,1,4,'images/amlodipine.jpg','2024-04-14 00:00:00'),(12,'Lisinopril',6,'ACE inhibitor for blood pressure control',18.50,75,2,4,'images/lisinopril.jpg','2024-06-30 00:00:00'),(13,'Metformin',7,'Oral medication for diabetes management',22.00,160,1,3,'images/metformin.jpg','2025-01-01 00:00:00'),(14,'Insulin',7,'Hormone for blood glucose control in diabetes',30.00,50,2,3,'images/insulin.jpg','2024-02-14 00:00:00'),(15,'Hydrocortisone',8,'Topical cream for skin irritation and allergies',6.00,200,1,5,'images/hydrocortisone.jpg','2024-11-01 00:00:00'),(16,'Benzoyl Peroxide',8,'Topical acne treatment',8.00,140,2,5,'images/benzoyl_peroxide.jpg','2025-03-10 00:00:00'),(17,'Vitamin C',9,'Dietary supplement for immune support',15.00,300,1,5,'images/vitamin_c.jpg','2025-05-15 00:00:00'),(18,'Vitamin D',9,'Dietary supplement for bone health',12.50,270,2,5,'images/vitamin_d.jpg','2024-12-25 00:00:00'),(19,'Adhesive Bandages',10,'First aid product for minor cuts and wounds',5.00,500,1,1,'images/bandages.jpg','2025-06-05 00:00:00'),(20,'Antiseptic Cream',10,'Topical cream for minor burns and cuts',8.50,300,2,1,'images/antiseptic_cream.jpg','2024-08-30 00:00:00');
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `address` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Pharma Supplier Inc.','contact@pharmasupplier.com','123 Main St, Springfield, IL'),(2,'HealthMed Distributors','info@healthmed.com','456 Elm St, Boston, MA'),(3,'Global Pharma Co.','support@globalpharma.com','789 Oak St, San Francisco, CA'),(4,'MedEx Supply','sales@medexsupply.com','101 Pine St, Austin, TX'),(5,'Wellness Wholesale','orders@wellnesswholesale.com','202 Maple St, Denver, CO'),(6,'VitalCare Medical Supplies','contact@vitalcaremed.com','303 Cedar St, Miami, FL'),(7,'DirectMed Suppliers','support@directmed.com','404 Birch St, New York, NY'),(8,'PureHealth Distributors','info@purehealth.com','505 Willow St, Seattle, WA'),(9,'MediMart Wholesale','sales@medimart.com','606 Ash St, Chicago, IL'),(10,'Pharma Direct','support@pharmadirect.com','707 Cherry St, Los Angeles, CA');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('pharmacist','admin') NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$CYU5WKnEiSR1bYBUrYwESuSCWBfj5U2YDf5UV525ONw3qod5.fpjG','admin@ex.com','Admin','admin','2024-12-03 03:44:42'),(2,'pharmacist','$2b$10$duhF4.U5PvTAi87a7D98jeECfgEpmmIc.5URbYXoPXGPyR32oLzxC','pm@ex.com','Pharmacist','pharmacist','2024-12-03 03:44:42'),(3,'at','$2b$10$/INmQ7K5liMXvVC9lxPwrOz0ZHSHo8cfHnueaIeyF7dB5eW9J09DW','newuser@example.com','Anh Thu','pharmacist','2024-12-03 03:48:26');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-11  8:41:31
