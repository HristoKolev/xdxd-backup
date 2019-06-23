use strum::IntoEnumIterator;
use strum_macros::EnumIter;

use crate::global::prelude::*;
use crate::docker_volumes::{create_docker_volumes_archive, restore_docker_volumes_archive};

#[derive(Clone, Debug, EnumIter, PartialEq, Eq, Hash)]
pub enum ArchiveType {
    DockerVolumes(String)
}

pub fn parse_archive_type(prefix: &str) -> Result<ArchiveType> {

    for archive_type in ArchiveType::all() {

        if archive_type.to_string() == prefix.to_lowercase() {
            return Ok(archive_type);
        }
    }

    Err(CustomError::user_error(&format!("Archive type not found: {}", prefix)))
}

pub fn get_archive_config(archive_type: &ArchiveType) -> ArchiveConfig {

    let app_config = app_config();

    let archive_config = match archive_type {
        ArchiveType::DockerVolumes(name) => app_config.docker_config.as_ref()
            .and_then(|x| x.get(name).cloned())
            .and_then(|x| x.archive_config)
    };

    archive_config.unwrap_or(app_config.archive_config.clone())
}

pub fn get_remote_config(archive_type: &ArchiveType) -> Vec<RemoteConfig> {

    let app_config = app_config();

    let custom_config = match archive_type {
        ArchiveType::DockerVolumes(name) => app_config.docker_config.as_ref()
            .and_then(|x| x.get(name).cloned())
            .and_then(|x| x.remote_config)
    };

    match custom_config {
        Some(x) => x,
        None => match app_config.remote_config.clone() {
            Some(x) => x,
            None => Vec::new()
        }
    }
}

impl ArchiveType {

    pub fn all() -> Vec<ArchiveType> {

        let all: Vec<ArchiveType> = ArchiveType::iter().collect();

        let mut result = Vec::new();

        for element in all {

            match element {
                ArchiveType::DockerVolumes(_) => {
                    app_config().docker_config.as_ref()
                        .map(|x| {
                            for (key, _) in x {
                                result.push(ArchiveType::DockerVolumes(key.to_string()))
                            }
                        });
                }
            }
        }

        result
    }

    pub fn get_config_name(&self) -> String {
        match self {
            ArchiveType::DockerVolumes(name) => name.clone()
        }
    }
}

impl ToString for ArchiveType {
    fn to_string(&self) -> String {
        match self {
            ArchiveType::DockerVolumes(name) => format!("docker-volumes.{}", name)
        }
    }
}

pub fn get_create_archive(archive_type: &ArchiveType) -> impl FnOnce(&str, &str) -> Result {

    match archive_type {
        ArchiveType::DockerVolumes(_) => create_docker_volumes_archive
    }
}

pub fn get_restore_archive(archive_type: &ArchiveType) -> impl FnOnce(&str, &str, &str) -> Result {

    match archive_type {
        ArchiveType::DockerVolumes(_) => restore_docker_volumes_archive
    }
}