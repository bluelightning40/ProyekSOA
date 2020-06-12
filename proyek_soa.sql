-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 12, 2020 at 02:50 PM
-- Server version: 10.1.35-MariaDB
-- PHP Version: 7.2.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `proyek_soa`
--
CREATE DATABASE IF NOT EXISTS `proyek_soa` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `proyek_soa`;

-- --------------------------------------------------------

--
-- Table structure for table `card_detail`
--

DROP TABLE IF EXISTS `card_detail`;
CREATE TABLE `card_detail` (
  `id_match` int(5) NOT NULL,
  `id_team` int(5) NOT NULL,
  `id_player` int(5) NOT NULL,
  `card_type` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `goal_detail`
--

DROP TABLE IF EXISTS `goal_detail`;
CREATE TABLE `goal_detail` (
  `id_match` int(5) NOT NULL,
  `id_team` int(5) NOT NULL,
  `id_player_scored` int(5) NOT NULL,
  `id_player_assist` int(5) NOT NULL,
  `minute_scored` int(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `leagues`
--

DROP TABLE IF EXISTS `leagues`;
CREATE TABLE `leagues` (
  `id_league` varchar(5) NOT NULL,
  `league_name` varchar(255) NOT NULL,
  `country_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `leagues`
--

INSERT INTO `leagues` (`id_league`, `league_name`, `country_name`) VALUES
('1', 'Surabaya cup', 'Indonesia'),
('2', 'Surabaya cups', 'Indonesia'),
('3', 'Surabaya cupsa', 'Indonesia');

-- --------------------------------------------------------

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
CREATE TABLE `matches` (
  `id_match` int(5) NOT NULL,
  `league_key` int(5) NOT NULL,
  `away_team` varchar(5) NOT NULL,
  `home_team` int(5) NOT NULL,
  `home_score` int(2) NOT NULL,
  `away_score` int(2) NOT NULL,
  `date` date NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `player`
--

DROP TABLE IF EXISTS `player`;
CREATE TABLE `player` (
  `id_player` int(5) NOT NULL,
  `id_team` int(5) NOT NULL,
  `nationality` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `position` varchar(255) NOT NULL,
  `player_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
CREATE TABLE `teams` (
  `id_team` int(5) NOT NULL,
  `team_name` varchar(255) NOT NULL,
  `team_league_id` varchar(5) NOT NULL,
  `team_logo` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id_user` varchar(255) NOT NULL,
  `email_user` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `api_hit` int(11) NOT NULL,
  `api_key` varchar(25) NOT NULL,
  `status` int(1) NOT NULL,
  `last_update` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id_user`, `email_user`, `password`, `api_hit`, `api_key`, `status`, `last_update`) VALUES
('abc', 'a@b.c', 'abc', 0, 'BW2h61YbIBlJFlx9e7NsKErU6', 0, '2020-06-12');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id_match`);

--
-- Indexes for table `player`
--
ALTER TABLE `player`
  ADD PRIMARY KEY (`id_player`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id_team`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `matches`
--
ALTER TABLE `matches`
  MODIFY `id_match` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `player`
--
ALTER TABLE `player`
  MODIFY `id_player` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id_team` int(5) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
