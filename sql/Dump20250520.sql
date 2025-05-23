-- MySQL dump 10.13  Distrib 8.0.41, for macos15 (arm64)
--
-- Host: localhost    Database: pharmacy_management
-- ------------------------------------------------------
-- Server version	9.2.0

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
INSERT INTO `categories` VALUES (1,'Pain Relief','Medicines for pain management and relief\n'),(2,'Antibiotics','Medicines for treating bacterial infections'),(3,'Allergy','Medicines for allergy relief'),(4,'Cough & Cold','Medicines for treating cough and cold symptoms'),(5,'Digestive Health','Medicines for digestive health support'),(6,'Heart & Blood Pressure','Medicines for heart and blood pressure management'),(7,'Diabetes','Medicines for managing diabetes'),(8,'Skin Care','Medicines and products for skin care'),(9,'Vitamins & Supplements','Vitamin and dietary supplements'),(10,'First Aid','Products for first aid and emergency care');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customers`
--

LOCK TABLES `Customers` WRITE;
/*!40000 ALTER TABLE `Customers` DISABLE KEYS */;
INSERT INTO `Customers` VALUES (1,'Jane','0123','ex@gmail.com'),(2,'Huynh Ngoc Anh Thu','0375296454','anhthuhuynh9103@gmail.com'),(5,'AT','1234','ex2@gmail.com'),(6,'Ngoc Anh Thu Huynh','090103','anhthuhuynh9103@gmail.com'),(7,'Kudo','12333','kudo@ex.com'),(9,'Noah','912003','noah@gmail.com'),(10,'Loki','5678','loki@ex.com'),(11,'Thor','6789','thor@ex.com'),(12,'Dio','5555','dio@ex.com'),(13,'Jojo','6666','jo@ex.com'),(14,'Haha','7777','lungmatcute91@gmail.com'),(15,'Lap Thuan','8888','lungmatcute91@gmail.com'),(16,'John Doe','1234567890','anhthuhuynh090103@gmail.com'),(17,'Jane Smith','2345678901','anhthuhuynh9103@gmail.com'),(18,'Robert Johnson','3456789012','anhthuhuynh9103@gmail.com'),(19,'Emily Davis','4567890123','lungmatcute91@gmail.com'),(20,'Michael Brown','5678901234',NULL),(21,'Sarah Wilson','6789012345',NULL),(22,'David Taylor','7890123456',NULL),(23,'Jessica Anderson','8901234567',NULL),(24,'Thomas Thomas','9012345678',NULL),(25,'Lisa Jackson','0123456789',NULL);
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
  `product_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medicine_id` (`medicine_id`),
  KEY `invoice_items_product_id_foreign_idx` (`product_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `invoice_items_ibfk_424` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invoice_items_ibfk_460` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invoice_items_product_id_foreign_idx` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (7,3,1,6,8.50,NULL),(8,3,2,3,7.00,NULL),(12,5,3,2,12.00,NULL),(13,5,9,3,15.00,NULL),(16,7,14,10,30.00,NULL),(34,13,6,2,11.50,NULL),(35,13,15,1,6.00,NULL),(36,13,20,2,8.50,NULL),(42,17,6,10,11.50,NULL),(43,17,11,5,20.00,NULL),(45,19,2,20,7.00,NULL),(46,19,3,5,12.00,NULL),(47,20,2,5,7.00,NULL),(48,20,6,5,11.50,NULL),(49,20,8,5,8.00,NULL),(52,22,17,20,15.00,NULL),(70,25,3,100,12.00,NULL),(73,28,2,100,7.00,NULL),(74,28,5,100,10.00,NULL),(80,34,3,97,12.00,NULL),(86,36,14,20,30.00,NULL),(87,36,6,100,11.50,NULL),(88,36,2,90,7.00,NULL),(89,37,18,80,12.50,NULL),(90,38,2,3,7.00,NULL),(91,38,6,29,11.50,NULL),(92,39,3,20,12.00,NULL),(93,40,3,20,12.00,NULL),(94,41,1,100,8.50,NULL),(95,42,1,10,8.50,NULL),(96,42,3,10,12.00,NULL),(97,43,1,1,8.50,NULL),(98,44,4,10,18.00,NULL),(99,45,8,5,8.00,NULL),(100,45,5,10,10.00,NULL),(101,46,1,100,8.50,NULL),(103,48,2,50,7.00,NULL),(104,49,1,2,8.50,NULL),(105,50,1,9,8.50,NULL),(106,51,NULL,10,11.00,2),(107,52,NULL,20,6.00,1),(108,50,4,5,18.00,NULL),(109,53,44,4,100.00,NULL),(110,54,NULL,1,60.00,100),(111,54,NULL,1,7.25,119);
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
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (3,'2024-12-13 12:24:45',72.00,'sale',1),(5,'2024-12-15 12:00:00',69.00,'sale',2),(7,'2024-12-03 12:04:00',300.00,'purchase',NULL),(13,'2024-12-13 02:12:55',46.00,'sale',9),(17,'2024-12-13 02:23:00',215.00,'sale',2),(19,'2024-12-13 02:32:46',200.00,'sale',6),(20,'2024-12-13 02:43:07',132.50,'sale',5),(22,'2024-12-13 05:02:07',300.00,'sale',9),(25,'2024-12-13 07:40:28',1200.00,'sale',7),(28,'2024-12-13 10:33:23',1700.00,'purchase',NULL),(34,'2024-12-13 10:43:22',1164.00,'purchase',NULL),(36,'2024-12-13 11:11:39',2380.00,'sale',11),(37,'2024-12-13 11:12:46',1000.00,'sale',2),(38,'2024-12-13 11:19:27',354.50,'sale',12),(39,'2024-12-13 12:19:01',240.00,'sale',NULL),(40,'2024-12-13 12:23:49',240.00,'sale',NULL),(41,'2024-12-14 12:23:25',850.00,'purchase',NULL),(42,'2024-12-15 03:26:39',205.00,'sale',2),(43,'2025-04-02 02:35:09',8.50,'sale',2),(44,'2025-04-03 04:05:32',180.00,'sale',NULL),(45,'2025-04-03 04:05:49',140.00,'sale',9),(46,'2025-04-03 04:06:05',850.00,'purchase',NULL),(47,'2025-05-14 12:13:16',1800.00,'sale',2),(48,'2025-05-15 08:59:40',350.00,'purchase',NULL),(49,'2025-05-15 13:46:19',17.00,'sale',NULL),(50,'2025-05-15 14:16:18',76.50,'sale',NULL),(51,'2025-05-15 14:03:34',110.00,'purchase',NULL),(52,'2025-05-15 14:34:01',120.00,'purchase',NULL),(53,'2025-05-20 11:36:52',400.00,'sale',15),(54,'2025-05-20 11:37:24',67.25,'purchase',NULL);
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
  `image` varchar(255) DEFAULT NULL,
  `expiry_date` datetime NOT NULL,
  `imagePublicId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `medicines_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `medicines_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES (1,'Acetaminophen',1,'Pain relief and fever reducer',8.50,188,2,1,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235425/medicines/morp9rcsub7hblgphdoz.webp','2026-05-20 00:00:00','medicines/morp9rcsub7hblgphdoz'),(2,'Aspirin',1,'Pain relief and anti-inflammatory',7.00,50,2,1,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235447/medicines/l0cn7mhfodwdq61i3i4q.webp','2025-08-15 00:00:00','medicines/l0cn7mhfodwdq61i3i4q'),(3,'Amoxicillin',2,'Antibiotic for bacterial infections',12.00,50,1,1,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235760/medicines/nl8emhjmplxjkchb7rtm.webp','2026-05-06 00:00:00','medicines/nl8emhjmplxjkchb7rtm'),(4,'Azithromycin',2,'Broad-spectrum antibiotic',18.00,40,2,1,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235514/medicines/xnqfidb5wfi0iseav3s0.jpg','2026-06-13 00:00:00','medicines/xnqfidb5wfi0iseav3s0'),(5,'Cetirizine',3,'Antihistamine for allergy relief',10.00,175,1,2,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235527/medicines/lspu3t6ra54sltcusa8e.jpg','2025-01-10 00:00:00','medicines/lspu3t6ra54sltcusa8e'),(6,'Loratadine',3,'Allergy relief for sneezing and runny nose',11.50,0,2,2,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235538/medicines/sgpfz89u0ize1hpwqjns.png','2027-05-20 00:00:00','medicines/sgpfz89u0ize1hpwqjns'),(7,'Guaifenesin',4,'Expectorant for cough relief',9.00,70,1,2,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235570/medicines/oaqfjfr84yociiyzgona.jpg','2028-05-25 00:00:00','medicines/oaqfjfr84yociiyzgona'),(8,'Dextromethorphan',4,'Cough suppressant for dry cough',8.00,85,2,2,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235595/medicines/wsgd46eghaj5zq4afr1h.jpg','2025-06-18 00:00:00','medicines/wsgd46eghaj5zq4afr1h'),(9,'Omeprazole',1,'For treating acid reflux and GERD',15.00,120,2,4,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235708/medicines/uly4cconui1klm2fvnv6.png','2025-07-16 00:00:00','medicines/uly4cconui1klm2fvnv6'),(10,'Ranitidine',5,'Antacid for stomach acidity and ulcers',12.00,95,2,2,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235745/medicines/ox1irssnwffx8yl0my4m.avif','2025-09-12 00:00:00','medicines/ox1irssnwffx8yl0my4m'),(11,'Amlodipine',6,'Medication for high blood pressure',20.00,85,1,4,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235810/medicines/o0togkeptskj6iv7lc6c.jpg','2027-08-07 00:00:00','medicines/o0togkeptskj6iv7lc6c'),(12,'Lisinopril',6,'ACE inhibitor for blood pressure control',18.50,75,2,4,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235852/medicines/i9zkgp4kplu4vr3xiqzu.jpg','2028-05-18 00:00:00','medicines/i9zkgp4kplu4vr3xiqzu'),(13,'Metformin',7,'Oral medication for diabetes management',22.00,160,1,3,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235886/medicines/ievlokhlrbi0f0g9x3xb.webp','2028-05-18 00:00:00','medicines/ievlokhlrbi0f0g9x3xb'),(14,'Insulin',7,'Hormone for blood glucose control in diabetes',30.00,30,2,3,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235899/medicines/omwizsctxscwqnxhpgus.jpg','2029-05-24 00:00:00','medicines/omwizsctxscwqnxhpgus'),(15,'Hydrocortisone',8,'Topical cream for skin irritation and allergies',6.00,200,1,5,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235913/medicines/kyqssdr7ann9toh7zbm9.jpg','2029-08-06 00:00:00','medicines/kyqssdr7ann9toh7zbm9'),(16,'Benzoyl Peroxide',8,'Topical acne treatment',8.00,140,2,5,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235961/medicines/qiubsjbpjsfttxflrlsp.png','2025-03-10 00:00:00','medicines/qiubsjbpjsfttxflrlsp'),(17,'Vitamin C',9,'Dietary supplement for immune support',15.00,301,1,5,'https://res.cloudinary.com/duy8dombh/image/upload/v1747236007/medicines/nasziq7m7fzhdbvcrbvg.webp','2025-05-15 00:00:00','medicines/nasziq7m7fzhdbvcrbvg'),(18,'Vitamin D',9,'Dietary supplement for bone health',12.50,200,2,5,'https://res.cloudinary.com/duy8dombh/image/upload/v1747235980/medicines/jw0vmdwgt0agwr968p2v.webp','2029-05-24 00:00:00','medicines/jw0vmdwgt0agwr968p2v'),(19,'Adhesive Bandages',10,'First aid product for minor cuts and wounds',5.00,500,1,1,'https://res.cloudinary.com/duy8dombh/image/upload/v1747236021/medicines/ajdffxrcs2offbrtyiw3.jpg','2025-06-05 00:00:00','medicines/ajdffxrcs2offbrtyiw3'),(20,'Antiseptic Cream',10,'Topical cream for minor burns and cuts',8.50,300,2,1,'https://res.cloudinary.com/duy8dombh/image/upload/v1747236036/medicines/n7a9c6oo1e1mpds7ximd.avif','2025-09-18 00:00:00','medicines/n7a9c6oo1e1mpds7ximd'),(44,'Pills',2,'Pills',100.00,6,7,4,'https://res.cloudinary.com/duy8dombh/image/upload/v1747740803/medicines/jk8guliwibmt2z3lgclf.png','2028-05-31 00:00:00','medicines/jk8guliwibmt2z3lgclf');
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(255) NOT NULL,
  `otp` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `isUsed` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `otps_phone` (`phone`),
  CONSTRAINT `otps_phone_fk` FOREIGN KEY (`phone`) REFERENCES `Customers` (`phone`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (1,'0375296454','$2b$10$C4BraVsOCp505V5Kqr0gb.q1xu3Jh9MJFeCpbtHB3IFxCt6Qgfj/q','2025-05-19 01:44:17',0,'2025-05-19 01:39:17','2025-05-19 01:39:17'),(2,'0375296454','$2b$10$uSNDZBArzyFzxkOfi5HHdeP6msJXexej.ho3RBniwh3zg3YH.f5Y.','2025-05-19 01:48:46',1,'2025-05-19 01:43:46','2025-05-19 01:44:43'),(3,'12333','$2b$10$bx3Na0Cik9skb9dKQwM1l.CGwgv/3gZecGTI5Dmq2S56J7Gbpx59G','2025-05-19 01:50:46',0,'2025-05-19 01:45:47','2025-05-19 01:45:47'),(4,'12333','$2b$10$nPj.mxwI1Cz5T3Gtz5VtberSN8W5wf4IcJdjrndVG20srrQ.EfBZ.','2025-05-19 01:53:23',0,'2025-05-19 01:48:23','2025-05-19 01:48:23'),(5,'12333','$2b$10$SXc0me5Xw1.nezbppCcAxOnEopnNvlIsHcGPfQSRGMDEj46rtPVyG','2025-05-19 01:54:49',0,'2025-05-19 01:49:49','2025-05-19 01:49:49'),(6,'12333','$2b$10$XWk2qhP7OkqeX0WG5nmSHur9FsAJpwMKSmicbK/Tple5gVchiGbAO','2025-05-19 01:55:03',0,'2025-05-19 01:50:03','2025-05-19 01:50:03'),(7,'0375296454','$2b$10$FjnIdi2huHlpstxmbO7uZ.nhBn1oQxtG8LSdKIkLHf/A2mqMWrBG2','2025-05-19 01:57:06',1,'2025-05-19 01:52:06','2025-05-19 01:52:24'),(8,'1234','$2b$10$2MFrMMXaNuv7bZgIL3NR0eOD/5HF5zEUPK0LpFblZkuZj.e1hK94K','2025-05-19 04:52:24',0,'2025-05-19 04:47:24','2025-05-19 04:47:24'),(9,'0375296454','$2b$10$xFz..Sk7CowyaOfuccd1m.J0k2KM.JC1N412LVCTUcRIZK.dJgniy','2025-05-19 16:28:15',0,'2025-05-19 16:23:15','2025-05-19 16:23:15'),(10,'0375296454','$2b$10$ZYlGBNZhdYC6dYzwDLJAB.jaQg2RHWRs/slnvLiBJq5b4WRTjIPmy','2025-05-19 16:29:28',1,'2025-05-19 16:24:28','2025-05-19 16:25:15'),(11,'0375296454','$2b$10$AKiER1Ymhihe5TSrQU33/.LT5MgiV3HkzA0VjtuoubVjlIvx2EYG6','2025-05-19 16:32:08',0,'2025-05-19 16:27:08','2025-05-19 16:27:08'),(12,'0375296454','$2b$10$Zz0bmXF2GPw1t0q6L/k4n.U96qyE1yx3f/XY3Bn/P7wKP8O8Z6crS','2025-05-19 16:34:17',1,'2025-05-19 16:29:18','2025-05-19 16:30:33'),(13,'0375296454','$2b$10$d1sjWWkK2OEwn5krBVAkguR5gfoD/5m6603vQ2SPHjDSzCDM5GwyK','2025-05-19 17:14:50',0,'2025-05-19 17:09:50','2025-05-19 17:09:50'),(14,'0375296454','$2b$10$nCaFvJ4YhZEigbG4Zy7o6emlnV8bdmBl8DSaKpyGrYA0BSZHYkNVu','2025-05-19 17:15:37',1,'2025-05-19 17:10:37','2025-05-19 17:11:34'),(15,'0375296454','$2b$10$TRbsxRNFJ4tNPs5YlubmjuZYW4k2.NTj4Iq8liv4mFImhaIelQAOa','2025-05-19 17:19:30',1,'2025-05-19 17:14:30','2025-05-19 17:15:20'),(16,'7777','$2b$10$vwVPFbSVEk3HcMtjnVkLL.paovUjWh9FKoySJWcez5d8pUrfuoDEa','2025-05-19 17:36:12',1,'2025-05-19 17:31:12','2025-05-19 17:32:00'),(17,'8888','$2b$10$qpZOa8oNBzPnbsdaSF0viu5Lvw1/Bnyy4AI383PUk1mZphkf9RpDy','2025-05-19 17:44:22',0,'2025-05-19 17:39:22','2025-05-19 17:39:22'),(18,'8888','$2b$10$OmAGOq/hfKcr4xYKlcNmye4h6sixkkPqbSydi0oQ2aWONX2MhVfFW','2025-05-19 17:47:33',1,'2025-05-19 17:42:33','2025-05-19 17:42:51'),(19,'7777','$2b$10$7b4WmI9dByTJu9RC5oxJvu7rrbo2eGbmQkarX85XJa7f7CREU1Rlu','2025-05-19 17:50:09',1,'2025-05-19 17:45:09','2025-05-19 17:45:29'),(20,'8888','$2b$10$yODBzzGp2I6xfzrRzadrzeoBw9lThYivqtB35NTkziipHvIpZ57qW','2025-05-19 17:53:21',1,'2025-05-19 17:48:21','2025-05-19 17:49:13'),(21,'8888','$2b$10$NLGEVJJj/uDopCRyB8gy8O/50moexwKI0XgecyYWw8fSk/vbCdQbq','2025-05-19 18:00:37',1,'2025-05-19 17:55:37','2025-05-19 17:56:05'),(22,'8888','$2b$10$rwa9ZTHusCWedbHwI7/vv.SeiRZnaa4x4ZTj9Y83lRjxxew59YvfS','2025-05-19 18:22:40',1,'2025-05-19 18:17:40','2025-05-19 18:18:02'),(23,'7777','$2b$10$eYzlt1v6ae08yA6jZkjIzu2qxM95QhnRjvw7h/jVby3G6Hz.9ctle','2025-05-19 18:24:45',0,'2025-05-19 18:19:45','2025-05-19 18:19:45'),(24,'7777','$2b$10$FkiQCJ157PUq1d0/FWnBieYFeH8x/yK1ds7eS3lTsT4qHDoim5xyu','2025-05-19 18:26:34',0,'2025-05-19 18:21:34','2025-05-19 18:21:34'),(25,'8888','$2b$10$/amZfLrHgOSsZHGve6tCaODR4lc0/RSbpEXDrPWVWVh9/F6aVaM7m','2025-05-19 18:29:07',0,'2025-05-19 18:24:07','2025-05-19 18:24:07'),(26,'0375296454','$2b$10$9cqM3Rs2Y9MYa9n7jZrswepIWQPZ4HWyBurpqJ0a2RAoDka9QpmHm','2025-05-19 18:29:57',1,'2025-05-19 18:24:57','2025-05-19 18:26:25'),(27,'0375296454','$2b$10$DmvhAdZwuu3uOHqDjUFSwu4JIUPU1pUa21EVCAvKc2Duy8t4KP2.y','2025-05-19 18:32:09',1,'2025-05-19 18:27:09','2025-05-19 18:27:24'),(28,'0375296454','$2b$10$X/8Js5Lf1Yr1ZSCoWz/SW.kJJU.RGq9TC4tZLZDKcz3uUTInn8n8K','2025-05-19 18:34:54',1,'2025-05-19 18:29:54','2025-05-19 18:30:09'),(29,'1234567890','$2b$10$tTTbiih1P83lKlMqrzpohuv9mB8/clk8nGhgCdvbZqdTtSF.T/BRe','2025-05-20 01:35:58',1,'2025-05-20 01:30:58','2025-05-20 01:32:50'),(30,'8888','$2b$10$9XioXKBduzd4/.xotGWjiO1FJwc3ac6.6LBHKZRHTR8CD.XyqVNv2','2025-05-20 01:38:35',1,'2025-05-20 01:33:35','2025-05-20 01:33:56'),(31,'7777','$2b$10$tQlH6eydoc5mSeNwjpy1WOnkagkYQkPCN0XzQiTCtain/bPgwxd3a','2025-05-20 01:41:47',1,'2025-05-20 01:36:47','2025-05-20 01:37:11'),(32,'2345678901','$2b$10$r9SxImMYoLE9Qwzu08Fd8uADGqo6nFlSs5IlbjqPxciuge6evlvHC','2025-05-20 01:52:57',0,'2025-05-20 01:47:57','2025-05-20 01:47:57'),(33,'2345678901','$2b$10$aEhJYwgyaqx/QxYsOLgniOP9Rxc30gJE4IbbYLwHjBQlMnblhUQHi','2025-05-20 01:59:33',0,'2025-05-20 01:54:33','2025-05-20 01:54:33'),(34,'3456789012','$2b$10$rNnwNzyMvOk46TxgeHHIG.JCX1JiTYtkmfPF75LEbCToIenO/TnCO','2025-05-20 02:01:42',1,'2025-05-20 01:56:42','2025-05-20 01:58:07'),(35,'4567890123','$2b$10$wqi4/tMq5iKU6SyR9v813OeCuEQGgjndabQcGXMVgtTpDRX9nlGzq','2025-05-20 02:04:37',1,'2025-05-20 01:59:37','2025-05-20 02:00:04'),(36,'8888','$2b$10$.bHkb8zKEC2w2eprb5c8ReVpSzTa1VWhZzk6dEdTgQH/OyHLqa0Mu','2025-05-20 02:05:36',1,'2025-05-20 02:00:36','2025-05-20 02:01:00'),(37,'7777','$2b$10$Fbh1z.UeBsJZxLUvrKQwhuaXPKHv4jFhsaD3G5N.tPK.ER83o28E2','2025-05-20 07:17:16',1,'2025-05-20 07:12:16','2025-05-20 07:12:38'),(38,'7777','$2b$10$YaflDhFn5EwBmJjuDBavE.MGxoLYXmWK.cmYvk4wocnUz/lBrJB06','2025-05-20 11:44:39',1,'2025-05-20 11:39:39','2025-05-20 11:40:03'),(39,'0375296454','$2b$10$GWrn2dEV357GVEifK3mxi.gs4HQ4YmhbUrL7Md1I4qZXSOEkQN4P6','2025-05-20 11:47:27',1,'2025-05-20 11:42:27','2025-05-20 11:42:49');
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacies`
--

DROP TABLE IF EXISTS `pharmacies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `contact_email` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacies`
--

LOCK TABLES `pharmacies` WRITE;
/*!40000 ALTER TABLE `pharmacies` DISABLE KEYS */;
INSERT INTO `pharmacies` VALUES (1,'Default Pharmacy','Default Address','contact@example.com','2025-05-14 17:20:57','2025-05-14 17:20:57');
/*!40000 ALTER TABLE `pharmacies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `brand` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `expiry_date` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `products_supplier_fk` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,'Brand 1','Product 1 of Supplier 1',6.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(2,1,'Brand 2','Product 2 of Supplier 1',11.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(3,1,'Brand 3','Product 3 of Supplier 1',16.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(4,1,'Brand 4','Product 4 of Supplier 1',21.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(5,1,'Brand 5','Product 5 of Supplier 1',26.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(6,1,'Brand 6','Product 6 of Supplier 1',31.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(7,1,'Brand 7','Product 7 of Supplier 1',36.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(8,1,'Brand 8','Product 8 of Supplier 1',41.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(9,1,'Brand 9','Product 9 of Supplier 1',46.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(10,1,'Brand 10','Product 10 of Supplier 1',51.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(11,2,'Brand 1','Product 1 of Supplier 2',7.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(12,2,'Brand 2','Product 2 of Supplier 2',12.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(13,2,'Brand 3','Product 3 of Supplier 2',17.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(14,2,'Brand 4','Product 4 of Supplier 2',22.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(15,2,'Brand 5','Product 5 of Supplier 2',27.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(16,2,'Brand 6','Product 6 of Supplier 2',32.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(17,2,'Brand 7','Product 7 of Supplier 2',37.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(18,2,'Brand 8','Product 8 of Supplier 2',42.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(19,2,'Brand 9','Product 9 of Supplier 2',47.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(20,2,'Brand 10','Product 10 of Supplier 2',52.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(21,3,'Brand 1','Product 1 of Supplier 3',8.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(22,3,'Brand 2','Product 2 of Supplier 3',13.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(23,3,'Brand 3','Product 3 of Supplier 3',18.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(24,3,'Brand 4','Product 4 of Supplier 3',23.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(25,3,'Brand 5','Product 5 of Supplier 3',28.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(26,3,'Brand 6','Product 6 of Supplier 3',33.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(27,3,'Brand 7','Product 7 of Supplier 3',38.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(28,3,'Brand 8','Product 8 of Supplier 3',43.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(29,3,'Brand 9','Product 9 of Supplier 3',48.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(30,3,'Brand 10','Product 10 of Supplier 3',53.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(31,4,'Brand 1','Product 1 of Supplier 4',9.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(32,4,'Brand 2','Product 2 of Supplier 4',14.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(33,4,'Brand 3','Product 3 of Supplier 4',19.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(34,4,'Brand 4','Product 4 of Supplier 4',24.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(35,4,'Brand 5','Product 5 of Supplier 4',29.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(36,4,'Brand 6','Product 6 of Supplier 4',34.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(37,4,'Brand 7','Product 7 of Supplier 4',39.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(38,4,'Brand 8','Product 8 of Supplier 4',44.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(39,4,'Brand 9','Product 9 of Supplier 4',49.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(40,4,'Brand 10','Product 10 of Supplier 4',54.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(41,5,'Brand 1','Product 1 of Supplier 5',10.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(42,5,'Brand 2','Product 2 of Supplier 5',15.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(43,5,'Brand 3','Product 3 of Supplier 5',20.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(44,5,'Brand 4','Product 4 of Supplier 5',25.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(45,5,'Brand 5','Product 5 of Supplier 5',30.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(46,5,'Brand 6','Product 6 of Supplier 5',35.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(47,5,'Brand 7','Product 7 of Supplier 5',40.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(48,5,'Brand 8','Product 8 of Supplier 5',45.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(49,5,'Brand 9','Product 9 of Supplier 5',50.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(50,5,'Brand 10','Product 10 of Supplier 5',55.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(51,6,'Brand 1','Product 1 of Supplier 6',11.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(52,6,'Brand 2','Product 2 of Supplier 6',16.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(53,6,'Brand 3','Product 3 of Supplier 6',21.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(54,6,'Brand 4','Product 4 of Supplier 6',26.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(55,6,'Brand 5','Product 5 of Supplier 6',31.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(56,6,'Brand 6','Product 6 of Supplier 6',36.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(57,6,'Brand 7','Product 7 of Supplier 6',41.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(58,6,'Brand 8','Product 8 of Supplier 6',46.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(59,6,'Brand 9','Product 9 of Supplier 6',51.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(60,6,'Brand 10','Product 10 of Supplier 6',56.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(61,7,'Brand 1','Product 1 of Supplier 7',12.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(62,7,'Brand 2','Product 2 of Supplier 7',17.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(63,7,'Brand 3','Product 3 of Supplier 7',22.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(64,7,'Brand 4','Product 4 of Supplier 7',27.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(65,7,'Brand 5','Product 5 of Supplier 7',32.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(66,7,'Brand 6','Product 6 of Supplier 7',37.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(67,7,'Brand 7','Product 7 of Supplier 7',42.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(68,7,'Brand 8','Product 8 of Supplier 7',47.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(69,7,'Brand 9','Product 9 of Supplier 7',52.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(70,7,'Brand 10','Product 10 of Supplier 7',57.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(71,8,'Brand 1','Product 1 of Supplier 8',13.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(72,8,'Brand 2','Product 2 of Supplier 8',18.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(73,8,'Brand 3','Product 3 of Supplier 8',23.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(74,8,'Brand 4','Product 4 of Supplier 8',28.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(75,8,'Brand 5','Product 5 of Supplier 8',33.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(76,8,'Brand 6','Product 6 of Supplier 8',38.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(77,8,'Brand 7','Product 7 of Supplier 8',43.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(78,8,'Brand 8','Product 8 of Supplier 8',48.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(79,8,'Brand 9','Product 9 of Supplier 8',53.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(80,8,'Brand 10','Product 10 of Supplier 8',58.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(81,9,'Brand 1','Product 1 of Supplier 9',14.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(82,9,'Brand 2','Product 2 of Supplier 9',19.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(83,9,'Brand 3','Product 3 of Supplier 9',24.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(84,9,'Brand 4','Product 4 of Supplier 9',29.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(85,9,'Brand 5','Product 5 of Supplier 9',34.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(86,9,'Brand 6','Product 6 of Supplier 9',39.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(87,9,'Brand 7','Product 7 of Supplier 9',44.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(88,9,'Brand 8','Product 8 of Supplier 9',49.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(89,9,'Brand 9','Product 9 of Supplier 9',54.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(90,9,'Brand 10','Product 10 of Supplier 9',59.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(91,10,'Brand 1','Product 1 of Supplier 10',15.00,'2026-01-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(92,10,'Brand 2','Product 2 of Supplier 10',20.00,'2026-02-28 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(93,10,'Brand 3','Product 3 of Supplier 10',25.00,'2026-03-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(94,10,'Brand 4','Product 4 of Supplier 10',30.00,'2026-04-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(95,10,'Brand 5','Product 5 of Supplier 10',35.00,'2026-05-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(96,10,'Brand 6','Product 6 of Supplier 10',40.00,'2026-06-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(97,10,'Brand 7','Product 7 of Supplier 10',45.00,'2026-07-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(98,10,'Brand 8','Product 8 of Supplier 10',50.00,'2026-08-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(99,10,'Brand 9','Product 9 of Supplier 10',55.00,'2026-09-30 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(100,10,'Brand 10','Product 10 of Supplier 10',60.00,'2026-10-31 17:00:00','2025-05-14 16:49:05','2025-05-14 16:49:05'),(101,1,'PharmaPlus','PainRelief',14.99,'2025-12-31 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(102,1,'PharmaPlus','RapidHeal',9.50,'2025-06-30 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(103,1,'PharmaPlus','ColdCure',12.00,'2024-11-15 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(104,1,'PharmaPlus','AllergyGuard',7.25,'2025-04-01 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(105,1,'PharmaPlus','HeartCare',29.99,'2026-01-01 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(106,1,'PharmaPlus','JointFlex',19.49,'2025-09-10 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(107,1,'PharmaPlus','SleepTight',8.75,'2025-03-20 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(108,1,'PharmaPlus','DigestAid',11.50,'2025-07-25 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(109,1,'PharmaPlus','SkinVital',13.99,'2026-02-28 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(110,1,'PharmaPlus','EyeVision',6.00,'2025-12-01 00:00:00','2025-05-14 18:00:45','2025-05-14 18:00:45'),(111,10,'MedCo','Paracetamol 500mg',2.50,'2026-03-15 00:00:00','2025-05-15 11:26:22','2025-05-15 11:26:22'),(112,10,'HealWell','Ibuprofen 200mg',3.20,'2025-12-30 00:00:00','2025-05-15 11:26:22','2025-05-15 11:26:22'),(113,10,'VitaPlus','Vitamin C 1000mg',5.10,'2026-06-10 00:00:00','2025-05-15 11:26:22','2025-05-15 11:26:22'),(114,10,'AllergyFree','Loratadine 10mg',4.75,'2025-11-01 00:00:00','2025-05-15 11:26:22','2025-05-15 11:26:22'),(115,10,'Respira','Bromhexine Syrup 100ml',6.40,'2026-01-20 00:00:00','2025-05-15 11:26:22','2025-05-15 11:26:22'),(116,4,'PharmaPlus','PainRelief',14.99,'2025-12-31 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(117,4,'PharmaPlus','RapidHeal',9.50,'2025-06-30 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(118,4,'PharmaPlus','ColdCure',12.00,'2024-11-15 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(119,4,'PharmaPlus','AllergyGuard',7.25,'2025-04-01 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(120,4,'PharmaPlus','HeartCare',29.99,'2026-01-01 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(121,4,'PharmaPlus','JointFlex',19.49,'2025-09-10 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(122,4,'PharmaPlus','SleepTight',8.75,'2025-03-20 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(123,4,'PharmaPlus','DigestAid',11.50,'2025-07-25 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(124,4,'PharmaPlus','SkinVital',13.99,'2026-02-28 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(125,4,'PharmaPlus','EyeVision',6.00,'2025-12-01 00:00:00','2025-05-17 17:38:29','2025-05-17 17:38:29'),(126,14,'Panadol','Paracetamol 500mg',5.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(127,14,'Panadol','Paracetamol 650mg',6.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(128,14,'Panadol','Paracetamol 1000mg',7.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(129,14,'Panadol','Cold & Flu',8.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(130,14,'Panadol','Extra Strength',9.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(131,14,'Panadol','Advance',10.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(132,14,'Panadol','Joint',11.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(133,14,'Panadol','Back & Neck',12.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(134,14,'Panadol','Period Pain',13.99,'2025-12-31 00:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12'),(135,14,'Panadol','Children\'s',14.99,'2025-12-30 17:00:00','2025-05-20 11:36:12','2025-05-20 11:36:12');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES ('20240401_add_avatar_to_users.js'),('20240402_update_medicines_image.js'),('20250514115022-fix-customer-phone-indexes.js'),('20250514123544-add-avatar-public-id-to-users.js'),('20250514131931-clean-up-user-indexes.js'),('20250514141525-add-imagePublicId-to-medicines.js'),('20250514163835-add-Products-table.js'),('20250514171931-create-pharmacies-and-add-pharmacy_id-to-users.js'),('20250514173414-update_products_supplier_fk.js'),('20250515121129-add-product-id-to-invoice-items.js'),('20250518233133-create-otp-table.js'),('20250518235305-update-otp-foreign-key-reference.js'),('20250518235649-fix-otp-customers-relationship.js'),('20250520075305-add-pharmacy-id-to-invoices.js'),('20250520075511-add-pharmacy-id-to-invoice-items.js'),('20250520075700-add-pharmacy-id-to-locations.js'),('20250520075803-add-pharmacy-id-to-products.js'),('20250520075913-add-pharmacy-id-to-suppliers.js'),('20250520083528-update-users-table.js'),('20250520084049-create-user-pharmacies-table.js'),('20250520085420-create-pharmacists-table.js'),('20250520085913-add-license-number-function.js'),('20250520142321-add-pharmacy-id-to-medicines.js'),('20250521000000-add-pharmacy-id-to-users.js'),('20250521000001-revert-to-original-schema.js'),('20250521000002-rename-avatar-columns.js'),('20250521000003-modify-users-table.js'),('20250521000004-remove-pharmacy-id-from-other-tables.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Pharma Supplier Inc.','contact@pharmasupplier.com','123 Main St, Springfield, IL'),(2,'HealthMed Distributors','info@healthmed.com','456 Elm St, Boston, MA'),(3,'Global Pharma Co.','support@globalpharma.com','789 Oak St, San Francisco, CA'),(4,'MedEx Supply','sales@medexsupply.com','101 Pine St, Austin, TX'),(5,'Wellness Wholesale','orders@wellnesswholesale.com','202 Maple St, Denver, CO'),(6,'VitalCare Medical Supplies','contact@vitalcaremed.com','303 Cedar St, Miami, FL'),(7,'DirectMed Suppliers','support@directmed.com','404 Birch St, New York, NY'),(8,'PureHealth Distributors','info@purehealth.com','505 Willow St, Seattle, WA'),(9,'MediMart Wholesale','sales@medimart.com','606 Ash St, Chicago, IL'),(10,'Pharma Direct','support@pharmadirect.com','707 Cherry St, Los Angeles, CA'),(14,'AT','at@gmail.com','144/1 Ấp Cá');
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
  `role` enum('admin','pharmacist') NOT NULL DEFAULT 'pharmacist',
  `created_at` datetime NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `avatarPublicId` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pharmacy_id` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `users_pharmacy_id_foreign_idx` (`pharmacy_id`),
  CONSTRAINT `users_pharmacy_id_foreign_idx` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$HTmMboIbMu1tTu15JzQ3LuNdS8GKVP9AnYfKBhdJnaQ0ZgPmEdF8y','anhthuhuynh9103@gmail.com','Admin Anh Thu','admin','2024-12-03 03:44:42','https://res.cloudinary.com/duy8dombh/image/upload/v1747229392/avatars/p1vanct8upfngnokkx8u.jpg','avatars/p1vanct8upfngnokkx8u','2025-05-20 08:36:44',1),(2,'pharmacist','$2b$10$duhF4.U5PvTAi87a7D98jeECfgEpmmIc.5URbYXoPXGPyR32oLzxC','pm@ex.com','Pharmacist','pharmacist','2024-12-03 03:44:42','https://res.cloudinary.com/duy8dombh/image/upload/v1747229816/avatars/xlg5ly5ni9m17bknrfmu.jpg','avatars/xlg5ly5ni9m17bknrfmu','2025-05-20 08:36:44',1),(3,'at','$2b$10$/INmQ7K5liMXvVC9lxPwrOz0ZHSHo8cfHnueaIeyF7dB5eW9J09DW','newuser@example.com','Anh Thu','pharmacist','2024-12-03 03:48:26',NULL,NULL,'2025-05-20 08:36:44',1),(5,'test','$2b$10$QxalSAl9t7CQVFOMXUNvTujDlWCQOyairuDcMbAw3lg6lQutDO7Em','anhthuhuynh090103@gmail.com','Test up','pharmacist','2024-12-12 14:59:29',NULL,NULL,'2025-05-20 08:36:44',1),(13,'kudo','$2b$10$8Lzvuhs5W7EXL5G8pl0CsOaNpFfbdl4S3M1Cs.bak3MtjQk.Mdhw6','kudo@example.com','Viet Anh','pharmacist','2024-12-12 17:24:01',NULL,NULL,'2025-05-20 08:36:44',1),(14,'loki','$2b$10$gTcw6mgZt8AypooKQC3QOez5XQpJ/hwJzs/7dhw7Jufp6BGj0s2qy','loki@example.com','Loki','pharmacist','2024-12-12 17:28:18',NULL,NULL,'2025-05-20 08:36:44',1),(17,'hera','$2b$10$lSnWlfhK31IdHNiW/ZYCN.5W2xyzmUlVS2uAYdBi3xOr5jecTX6Q2','hera@ex.com','Hera','pharmacist','2024-12-12 18:11:52',NULL,NULL,'2025-05-20 08:36:44',1),(18,'zeus','$2b$10$RhKjEDgMfJ4nisuHlC0jTe2M6f.QRe9gQN6IXJCQ0/ebSW62vVrXa','zeus@ex.com','Zeus','pharmacist','2024-12-13 07:14:30',NULL,NULL,'2025-05-20 08:36:44',1);
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

-- Dump completed on 2025-05-20 18:52:29
